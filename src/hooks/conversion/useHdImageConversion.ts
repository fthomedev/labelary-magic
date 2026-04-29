import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { useServerUpscaler } from './useServerUpscaler';
import { DEFAULT_CONFIG, ProcessingConfig } from '@/config/processingConfig';
import { calculateProgress } from './useProgressCalculator';
import { LabelSize, DEFAULT_LABEL_SIZE, buildLabelarySize } from '@/types/labelSize';

// Semaphore for controlling concurrent requests
class Semaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

export const useHdImageConversion = () => {
  const { splitZplIntoLabels } = useZplLabelProcessor();
  const { filterValidLabels } = useZplValidator();
  const { upscaleImages } = useServerUpscaler();

  const convertZplToHdImages = async (
    labels: string[],
    onProgress: (progress: number, currentLabel?: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG,
    labelSize: LabelSize = DEFAULT_LABEL_SIZE
  ): Promise<Blob[]> => {
    console.log(`\n🔧 convertZplToHdImages: HD mode (with upscaling)`);

    const validLabels = filterValidLabels(labels);

    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    const dpmm = '8dpmm';
    const labelarySize = buildLabelarySize(labelSize);
    const labelaryUrl = `https://api.labelary.com/v1/printers/${dpmm}/labels/${labelarySize}/0/`;
    console.log(`📊 Using Labelary API at ${dpmm} (${labelSize.widthCm}×${labelSize.heightCm} cm), then 2x server upscale`);
    console.log(`📐 Labelary URL (HD PNG): ${labelaryUrl}`);

    const MAX_CONCURRENT = 5;
    const semaphore = new Semaphore(MAX_CONCURRENT);
    const results: (Blob | null)[] = new Array(validLabels.length).fill(null);
    const failedIndices: number[] = [];
    let completed = 0;
    let rateLimitHits = 0;

    // Throttled progress (rAF) — collapses bursts of updates into one paint
    let pendingFrame = false;
    const emitProgress = () => {
      if (pendingFrame) return;
      pendingFrame = true;
      const flush = () => {
        pendingFrame = false;
        const stageProgress = (completed / validLabels.length) * 100;
        const overallProgress = calculateProgress('hd', 'converting', stageProgress);
        onProgress(overallProgress, completed);
      };
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 16);
      }
    };

    console.log(`\n========== PNG CONVERSION START ==========`);
    console.log(`📊 Input: ${validLabels.length} labels`);
    console.log(`⚙️ Concurrent limit: ${MAX_CONCURRENT}`);
    const startTime = Date.now();

    const convertLabel = async (label: string, index: number, isRetryPass: boolean = false): Promise<boolean> => {
      await semaphore.acquire();

      try {
        const maxRetries = 4;
        const baseDelays = [1500, 3000, 6000, 12000];

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`🔄 [${index + 1}/${validLabels.length}] Attempt ${attempt + 1}/${maxRetries}${isRetryPass ? ' (retry pass)' : ''}`);

            const response = await fetch(labelaryUrl, {
              method: 'POST',
              headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: label,
            });

            if (response.status === 429) {
              rateLimitHits++;
              const waitTime = baseDelays[attempt] || 24000;
              console.warn(`⚠️ [${index + 1}] Rate limit 429 - waiting ${waitTime / 1000}s before retry`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }

            if (!response.ok) {
              console.error(`❌ [${index + 1}] HTTP ${response.status}`);
              throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            if (blob.size === 0) {
              console.error(`❌ [${index + 1}] Empty PNG received`);
              throw new Error('Empty PNG');
            }

            results[index] = blob;
            console.log(`✅ [${index + 1}] PNG generated (${(blob.size / 1024).toFixed(1)}KB)`);
            return true;

          } catch (error) {
            if (attempt < maxRetries - 1) {
              const waitTime = 1000 * (attempt + 1);
              console.warn(`⚠️ [${index + 1}] Error, retrying in ${waitTime / 1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }

        console.error(`🚨 [${index + 1}] FAILED after ${maxRetries} attempts`);
        return false;

      } finally {
        if (!isRetryPass) {
          completed++;
          emitProgress();
        }
        semaphore.release();
      }
    };

    console.log(`\n--- First Pass ---`);
    const firstPassResults = await Promise.all(
      validLabels.map((label, i) => convertLabel(label, i, false))
    );

    firstPassResults.forEach((success, index) => {
      if (!success) failedIndices.push(index);
    });

    if (failedIndices.length > 0) {
      console.log(`\n--- Second Pass (${failedIndices.length} failed labels) ---`);
      for (const index of failedIndices) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await convertLabel(validLabels[index], index, true);
      }
    }

    const finalNullIndices = results.map((img, i) => img === null ? i : -1).filter(i => i !== -1);
    const pngImages = results.filter((img): img is Blob => img !== null);
    const pngElapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`\n========== PNG CONVERSION SUMMARY ==========`);
    console.log(`📊 Input labels: ${validLabels.length}`);
    console.log(`✅ PNG generated: ${pngImages.length}`);
    console.log(`⚠️ Rate limit hits: ${rateLimitHits}`);
    console.log(`⏱️ Time: ${pngElapsed}s`);

    if (finalNullIndices.length > 0) {
      console.error(`🚨 FAILED labels at indices: [${finalNullIndices.join(', ')}]`);
      console.error(`🚨 LABEL LOSS: ${finalNullIndices.length} labels could not be converted!`);
    } else {
      console.log(`✅ All ${validLabels.length} labels converted successfully`);
    }
    console.log(`=============================================\n`);

    // Server-side upscaling with Nearest Neighbor for HD mode
    let finalImages = pngImages;

    if (pngImages.length > 0) {
      console.log(`\n========== SERVER UPSCALING START ==========`);
      console.log(`🔄 Upscaling ${pngImages.length} images at 2x with Nearest Neighbor`);
      const upscaleStartTime = Date.now();

      try {
        finalImages = await upscaleImages(pngImages, 2, (current, total) => {
          const stageProgress = (current / total) * 100;
          const overallProgress = calculateProgress('hd', 'upscaling', stageProgress);
          onProgress(overallProgress, current);
        });

        const upscaleElapsed = ((Date.now() - upscaleStartTime) / 1000).toFixed(1);
        console.log(`✅ Server upscaling completed in ${upscaleElapsed}s`);
        console.log(`=============================================\n`);
      } catch (error) {
        console.error('❌ Server upscaling failed, using original images:', error);
        finalImages = pngImages;
      }
    }

    const organizingStart = calculateProgress('hd', 'organizing', 0);
    onProgress(organizingStart);

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalLoss = validLabels.length - finalImages.length;

    console.log(`🎯 HD conversion complete: ${finalImages.length}/${validLabels.length} in ${totalElapsed}s`);

    if (totalLoss > 0) {
      console.error(`🚨 TOTAL LABEL LOSS: ${totalLoss} labels (input: ${validLabels.length}, output: ${finalImages.length})`);
    }

    return finalImages;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for HD processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for HD: Found ${labels.length} labels`);
    return labels;
  };

  return {
    convertZplToHdImages,
    parseLabelsFromZpl,
  };
};
