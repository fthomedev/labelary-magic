
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { useImageUpscaler } from './useImageUpscaler';
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';

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

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { splitZplIntoLabels } = useZplLabelProcessor();
  const { filterValidLabels } = useZplValidator();
  const { upscaleImages, preloadUpscaler } = useImageUpscaler();

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = A4_CONFIG,
    enhanceLabels: boolean = false
  ): Promise<Blob[]> => {
    const validLabels = filterValidLabels(labels);
    
    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    // OPTIMIZATION: Pre-load upscaler model while PNG conversion starts (only if enhancing)
    const preloadPromise = enhanceLabels ? preloadUpscaler() : Promise.resolve();

    const MAX_CONCURRENT = 4; // Reduced to avoid 429 rate limits
    const semaphore = new Semaphore(MAX_CONCURRENT);
    const results: (Blob | null)[] = new Array(validLabels.length).fill(null);
    const failedIndices: number[] = [];
    let completed = 0;
    let rateLimitHits = 0;
    
    console.log(`\n========== PNG CONVERSION START ==========`);
    console.log(`📊 Input: ${validLabels.length} labels`);
    console.log(`⚙️ Concurrent limit: ${MAX_CONCURRENT}`);
    const startTime = Date.now();

    // Phase 1: ZPL to PNG conversion (0-55% progress)
    const convertLabel = async (label: string, index: number, isRetryPass: boolean = false): Promise<boolean> => {
      await semaphore.acquire();
      
      try {
        const maxRetries = 4;
        const baseDelays = [3000, 6000, 12000, 24000]; // Exponential backoff for 429
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            console.log(`🔄 [${index + 1}/${validLabels.length}] Attempt ${attempt + 1}/${maxRetries}${isRetryPass ? ' (retry pass)' : ''}`);
            
            const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
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
              console.warn(`⚠️ [${index + 1}] Rate limit 429 - waiting ${waitTime/1000}s before retry`);
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
              console.warn(`⚠️ [${index + 1}] Error, retrying in ${waitTime/1000}s...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
          }
        }
        
        console.error(`🚨 [${index + 1}] FAILED after ${maxRetries} attempts`);
        return false;
        
      } finally {
        if (!isRetryPass) {
          completed++;
          const progressValue = (completed / validLabels.length) * 55;
          onProgress(progressValue);
        }
        semaphore.release();
      }
    };

    // First pass: Process all labels in parallel
    console.log(`\n--- First Pass ---`);
    const firstPassResults = await Promise.all(
      validLabels.map((label, i) => convertLabel(label, i, false))
    );
    
    // Identify failed labels
    firstPassResults.forEach((success, index) => {
      if (!success) failedIndices.push(index);
    });
    
    // Second pass: Retry failed labels sequentially (more conservative)
    if (failedIndices.length > 0) {
      console.log(`\n--- Second Pass (${failedIndices.length} failed labels) ---`);
      for (const index of failedIndices) {
        // Wait before retry to let rate limit cool down
        await new Promise(resolve => setTimeout(resolve, 2000));
        await convertLabel(validLabels[index], index, true);
      }
    }
    
    // Final validation
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

    let finalImages: Blob[];
    
    // Phase 2: AI Upscaling (55-90% progress) - ONLY if enhanceLabels is enabled
    if (enhanceLabels) {
      // Ensure upscaler is ready before starting
      await preloadPromise;
      console.log(`🔍 Starting AI upscaling of ${pngImages.length} images...`);
      const upscaleStartTime = Date.now();
      
      const upscaledImages = await upscaleImages(pngImages, (upscaleProgress) => {
        // Map upscale progress (0-100) to overall progress (55-90)
        const overallProgress = 55 + (upscaleProgress * 0.35);
        onProgress(overallProgress);
      });
      
      const upscaleElapsed = ((Date.now() - upscaleStartTime) / 1000).toFixed(1);
      
      // CRITICAL: Validate upscaling preserved all images
      const upscaleLossCount = pngImages.length - upscaledImages.length;
      console.log(`✨ AI upscaling complete: ${upscaledImages.length}/${pngImages.length} images in ${upscaleElapsed}s`);
      
      if (upscaleLossCount > 0) {
        console.error(`🚨 CRITICAL: ${upscaleLossCount} labels lost during upscaling!`);
      }
      
      finalImages = upscaledImages;
    } else {
      console.log(`⏭️ Skipping AI upscaling (enhance labels disabled)`);
      finalImages = pngImages;
    }
    
    // Set progress to 90% after upscaling (remaining 10% for PDF generation)
    onProgress(90);
    
    const totalElapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    const totalLoss = validLabels.length - finalImages.length;
    
    console.log(`🎯 A4 conversion complete: ${finalImages.length}/${validLabels.length} in ${totalElapsed}s`);
    
    if (totalLoss > 0) {
      console.error(`🚨 TOTAL LABEL LOSS: ${totalLoss} labels (input: ${validLabels.length}, output: ${finalImages.length})`);
    }
    
    return finalImages;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for A4 processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for A4: Found ${labels.length} labels`);
    
    // Log first few characters of each label for debugging
    labels.forEach((label, index) => {
      console.log(`📄 A4 Label ${index + 1}: ${label.substring(0, 50)}...`);
    });
    
    return labels;
  };

  return {
    convertZplToA4Images,
    parseLabelsFromZpl
  };
};
