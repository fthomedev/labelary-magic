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
  const { upscaleImages, upscaleSingleImage } = useServerUpscaler();

  const convertZplToHdImages = async (
    labels: string[],
    onProgress: (progress: number, currentLabel?: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG,
    labelSize: LabelSize = DEFAULT_LABEL_SIZE
  ): Promise<Blob[]> => {
    console.log(`\n🔧 convertZplToHdImages: HD mode (with upscaling, pipelined)`);

    const validLabels = filterValidLabels(labels);

    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    const dpmm = '8dpmm';
    const labelarySize = buildLabelarySize(labelSize);
    const labelaryUrl = `https://api.labelary.com/v1/printers/${dpmm}/labels/${labelarySize}/0/`;
    console.log(`📊 Using Labelary API at ${dpmm} (${labelSize.widthCm}×${labelSize.heightCm} cm), then 2x server upscale`);
    console.log(`📐 Labelary URL (HD PNG): ${labelaryUrl}`);

    const PNG_CONCURRENT = 5;
    const UPSCALE_CONCURRENT = 6;
    const pngSemaphore = new Semaphore(PNG_CONCURRENT);
    const upscaleSemaphore = new Semaphore(UPSCALE_CONCURRENT);

    const pngResults: (Blob | null)[] = new Array(validLabels.length).fill(null);
    const upscaleResults: (Blob | null)[] = new Array(validLabels.length).fill(null);
    const upscalePromises: Promise<void>[] = [];
    const failedIndices: number[] = [];

    let pngCompleted = 0;
    let upscaleCompleted = 0;
    let rateLimitHits = 0;

    // Throttled progress (rAF) — collapses bursts of updates into one paint.
    // We blend PNG fetch (50%) + upscale (50%) progress into a single bar.
    let pendingFrame = false;
    const emitProgress = () => {
      if (pendingFrame) return;
      pendingFrame = true;
      const flush = () => {
        pendingFrame = false;
        const total = validLabels.length;
        // Phase 'converting' (Labelary) = 0..50%, phase 'upscaling' = 50..100% of converting bar
        const pngFrac = pngCompleted / total;
        const upFrac = upscaleCompleted / total;
        if (upFrac < 1) {
          // Still upscaling — show upscale progress (which already includes PNG completion)
          const stageProgress = ((pngFrac + upFrac) / 2) * 100;
          // Use 'converting' band; final upscaling stage handled in main pipeline below
          const overall = calculateProgress('hd', 'converting', stageProgress);
          onProgress(overall, upscaleCompleted);
        } else {
          const overall = calculateProgress('hd', 'upscaling', 100);
          onProgress(overall, upscaleCompleted);
        }
      };
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 16);
      }
    };

    console.log(`\n========== PIPELINED PNG + UPSCALE START ==========`);
    console.log(`📊 Input: ${validLabels.length} labels`);
    console.log(`⚙️ PNG concurrency: ${PNG_CONCURRENT} | Upscale concurrency: ${UPSCALE_CONCURRENT}`);
    const startTime = Date.now();

    // Schedule upscale for a PNG as soon as it's ready
    const scheduleUpscale = (index: number, pngBlob: Blob) => {
      const p = (async () => {
        await upscaleSemaphore.acquire();
        try {
          try {
            upscaleResults[index] = await upscaleSingleImage(pngBlob, 2);
          } catch (err) {
            console.warn(`⚠️ [${index + 1}] upscale failed, using original PNG:`, err);
            upscaleResults[index] = pngBlob;
          }
        } finally {
          upscaleCompleted++;
          emitProgress();
          upscaleSemaphore.release();
        }
      })();
      upscalePromises.push(p);
    };

    const convertLabel = async (label: string, index: number, isRetryPass: boolean = false): Promise<boolean> => {
      await pngSemaphore.acquire();

      try {
        const maxRetries = 4;
        const baseDelays = [1500, 3000, 6000, 12000];

        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`🔄 [${index + 1}/${validLabels.length}] PNG attempt ${attempt + 1}/${maxRetries}${isRetryPass ? ' (retry)' : ''}`);

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
              console.warn(`⚠️ [${index + 1}] Rate limit 429 - waiting ${waitTime / 1000}s`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              continue;
            }

            if (!response.ok) {
              throw new Error(`HTTP ${response.status}`);
            }

            const blob = await response.blob();
            if (blob.size === 0) {
              throw new Error('Empty PNG');
            }

            pngResults[index] = blob;
            console.log(`✅ [${index + 1}] PNG ready (${(blob.size / 1024).toFixed(1)}KB) → upscale queued`);

            // Kick off upscale immediately — overlap with remaining Labelary fetches
            scheduleUpscale(index, blob);
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
          pngCompleted++;
          emitProgress();
        }
        pngSemaphore.release();
      }
    };

    // First pass — all labels in parallel (bounded by semaphore)
    console.log(`\n--- First Pass (PNG fetch) ---`);
    const firstPassResults = await Promise.all(
      validLabels.map((label, i) => convertLabel(label, i, false))
    );

    firstPassResults.forEach((success, index) => {
      if (!success) failedIndices.push(index);
    });

    // Retry pass for failed labels (sequential with delay)
    if (failedIndices.length > 0) {
      console.log(`\n--- Second Pass (${failedIndices.length} failed) ---`);
      for (const index of failedIndices) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await convertLabel(validLabels[index], index, true);
      }
    }

    const pngElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const pngOk = pngResults.filter((p) => p !== null).length;
    console.log(`\n========== PNG PHASE DONE ==========`);
    console.log(`✅ PNGs: ${pngOk}/${validLabels.length} | rate-limit hits: ${rateLimitHits} | ${pngElapsed}s`);

    // Wait for in-flight upscales scheduled during PNG phase to finish
    console.log(`⏳ Waiting for ${upscalePromises.length - upscaleCompleted} pending upscales to finish...`);
    await Promise.all(upscalePromises);

    // Fallback: any PNG that exists but somehow didn't get an upscale slot — use original
    for (let i = 0; i < validLabels.length; i++) {
      if (upscaleResults[i] === null && pngResults[i] !== null) {
        upscaleResults[i] = pngResults[i];
      }
    }

    const finalImages = upscaleResults.filter((b): b is Blob => b !== null);
    const finalNullIndices = upscaleResults
      .map((img, i) => (img === null ? i : -1))
      .filter((i) => i !== -1);

    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalLoss = validLabels.length - finalImages.length;

    console.log(`\n========== HD PIPELINE COMPLETE ==========`);
    console.log(`✅ Final images: ${finalImages.length}/${validLabels.length} in ${totalElapsed}s`);
    if (finalNullIndices.length > 0) {
      console.error(`🚨 Missing at indices: [${finalNullIndices.join(', ')}]`);
    }
    if (totalLoss > 0) {
      console.error(`🚨 LABEL LOSS: ${totalLoss} labels`);
    }

    const organizingStart = calculateProgress('hd', 'organizing', 0);
    onProgress(organizingStart);

    return finalImages;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for HD processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for HD: Found ${labels.length} labels`);
    return labels;
  };

  // Keep batch-mode upscaler exposed for non-pipelined consumers (compat)
  void upscaleImages;

  return {
    convertZplToHdImages,
    parseLabelsFromZpl,
  };
};
