import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { delay } from '@/utils/pdfUtils';
import { parseZplBlocks, countZplLabelsWithLog } from '@/utils/zplUtils';
import { DEFAULT_CONFIG, ProcessingMetricsTracker, ProcessingConfig } from '@/config/processingConfig';
import { LabelSize, DEFAULT_LABEL_SIZE, buildLabelarySize } from '@/types/labelSize';
import { reportProcessingError } from '@/lib/errorLogging';

export interface ConversionLogContext {
  zplFormat?: 'tiktok' | 'shopee' | 'unknown';
  twoColumn?: boolean;
  processingType?: 'standard' | 'a4' | 'hd';
}

export interface ConversionResult {
  pdfs: Blob[];
  totalBatches: number;
  failedBatches: number;
  /** Labels that were dropped because their batch failed permanently. */
  missingLabels: number;
  rateLimitHits: number;
}


export const useZplApiConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplBlocksToPdfs = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG,
    labelSize: LabelSize = DEFAULT_LABEL_SIZE,
    logContext: ConversionLogContext = {}
  ): Promise<ConversionResult> => {

    const labelarySize = buildLabelarySize(labelSize);
    const labelaryUrl = `https://api.labelary.com/v1/printers/8dpmm/labels/${labelarySize}/`;
    console.log(`📐 Labelary URL (PDF): ${labelaryUrl} (${labelSize.widthCm}×${labelSize.heightCm} cm)`);
    const totalStartTime = Date.now();
    
    console.log(`🏁 Starting conversion of ${labels.length} labels with config:`, config);

    // Detect heavy embedded graphics (^GFA / ^GFB) — Labelary rejects requests
    // whose decoded embedded images/fonts exceed 2 MB total. When a significant
    // share of labels contains embedded graphics, shrink the batch size so each
    // request stays well below that limit.
    const labelsWithGraphics = labels.filter(l => /\^GF[AB]/.test(l)).length;
    const graphicsRatio = labels.length > 0 ? labelsWithGraphics / labels.length : 0;
    let effectiveBatchSize = config.labelsPerBatch;
    if (graphicsRatio >= 0.3) {
      effectiveBatchSize = Math.min(10, Math.max(1, Math.floor(config.labelsPerBatch / 3)));
      console.log(`🖼️ Imagens pesadas detectadas (${labelsWithGraphics}/${labels.length} etiquetas com ^GFA/^GFB) — reduzindo batch de ${config.labelsPerBatch} para ${effectiveBatchSize} etiquetas`);
    }

    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += effectiveBatchSize) {
      batches.push(labels.slice(i, i + effectiveBatchSize));
    }

    console.log(`📦 Created ${batches.length} batches of ~${effectiveBatchSize} labels each`);
    
    // Concurrency starts at 2 and drops to 1 as soon as the API rate-limits us.
    let parallelBatchesLimit = 2;
    let rateLimitHits = 0;
    // While the API is limiting, every worker waits until this timestamp.
    let globalPauseUntil = 0;
    const results: (Blob | null)[] = new Array(batches.length).fill(null);
    const failedBatches: number[] = [];
    let completed = 0;

    // Shared context for failure logging (metadata only, never ZPL content)
    const hasImages = labelsWithGraphics > 0;
    const baseLogContext = {
      processingType: logContext.processingType ?? ('standard' as const),
      labelCountAttempted: labels.length,
      zplFormat: logContext.zplFormat,
      labelSize: `${labelSize.widthCm}x${labelSize.heightCm}`,
      twoColumn: logContext.twoColumn,
      hasImages,
      batchSize: effectiveBatchSize,
    };
    const lastErrorByBatch = new Map<number, unknown>();
    const lastStatusByBatch = new Map<number, number>();

    const MAX_RATE_LIMIT_RETRIES = 8;
    const jitter = (ms: number) => ms + Math.floor(Math.random() * 400);

    const waitForGlobalPause = async () => {
      const remaining = globalPauseUntil - Date.now();
      if (remaining > 0) await delay(remaining);
    };

    const processBatch = async (batchLabels: string[], batchIndex: number, maxRetries: number = config.maxRetries, baseDelay: number = config.delayBetweenBatches): Promise<Blob | null> => {
      let retryCount = 0;
      let rateLimitRetries = 0;

      while (retryCount < maxRetries && rateLimitRetries < MAX_RATE_LIMIT_RETRIES) {
        try {
          await waitForGlobalPause();

          const blockZPL = batchLabels.join('');

          const response = await fetch(labelaryUrl, {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
          });

          if (response.status === 429) {
            // Rate limit gets its own retry budget with exponential backoff and
            // honours Retry-After when the API provides it.
            rateLimitRetries++;
            rateLimitHits++;
            lastStatusByBatch.set(batchIndex, 429);

            if (parallelBatchesLimit > 1) {
              parallelBatchesLimit = 1;
              console.log('🐢 Rate limit detectado — reduzindo para 1 lote por vez');
            }

            const retryAfterHeader = response.headers.get('Retry-After');
            const retryAfterMs = retryAfterHeader ? parseFloat(retryAfterHeader) * 1000 : NaN;
            const backoff = Number.isFinite(retryAfterMs) && retryAfterMs > 0
              ? Math.min(retryAfterMs, 30000)
              : Math.min(config.fallbackDelay * Math.pow(2, rateLimitRetries - 1), 20000);
            const waitTime = jitter(backoff);

            // Pause every other in-flight batch too, so we stop hammering the API.
            globalPauseUntil = Math.max(globalPauseUntil, Date.now() + waitTime);
            console.log(`⏳ Rate limited on batch ${batchIndex + 1} (tentativa ${rateLimitRetries}), waiting ${waitTime}ms...`);
            await delay(waitTime);
            continue;
          }

          if (!response.ok) {
            lastStatusByBatch.set(batchIndex, response.status);
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty PDF received');
          }
          
          console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed (${blob.size} bytes)`);
          return blob;
          
        } catch (error) {
          retryCount++;
          lastErrorByBatch.set(batchIndex, error);
          console.error(`❌ Batch ${batchIndex + 1} attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            await delay(jitter(baseDelay * Math.pow(2, retryCount - 1)));
          }
        }

      }
      
      return null;
    };


    // Process batches in parallel groups (concurrency adapts to rate limiting)
    let i = 0;
    while (i < batches.length) {
      const groupSize = parallelBatchesLimit;
      const parallelBatches = batches.slice(i, i + groupSize);
      const startIdx = i;

      const batchResults = await Promise.all(
        parallelBatches.map((batch, j) => processBatch(batch, startIdx + j))
      );

      batchResults.forEach((result, j) => {
        if (result) {
          results[startIdx + j] = result;
        } else {
          failedBatches.push(startIdx + j);
        }
      });

      completed += parallelBatches.length;
      const progressValue = (completed / batches.length) * 90; // Reserve 10% for retry
      onProgress(progressValue);

      i += parallelBatches.length;

      // Delay between groups — longer once the API started rate-limiting us
      if (i < batches.length) {
        await delay(rateLimitHits > 0 ? Math.max(config.delayBetweenBatches, 1500) : config.delayBetweenBatches);
      }
    }
    
    // Retry failed batches sequentially with longer delays
    if (failedBatches.length > 0) {
      console.log(`🔄 Retrying ${failedBatches.length} failed batches sequentially...`);
      
      for (const batchIndex of failedBatches) {
        await delay(config.fallbackDelay); // Wait before retry
        
        const result = await processBatch(batches[batchIndex], batchIndex, 3, config.fallbackDelay);
        
        if (result) {
          results[batchIndex] = result;
          console.log(`✅ Batch ${batchIndex + 1} recovered successfully`);
        } else {
          console.error(`💥 Batch ${batchIndex + 1} permanently failed`);
          reportProcessingError({
            ...baseLogContext,
            errorType: 'labelary_batch_failed',
            error: lastErrorByBatch.get(batchIndex),
            httpStatus: lastStatusByBatch.get(batchIndex),
            failedCount: batches[batchIndex].length,
            processingTimeMs: Date.now() - totalStartTime,
            metadata: {
              batchIndex: batchIndex + 1,
              totalBatches: batches.length,
              labelsInBatch: batches[batchIndex].length,
              labelarySize,
              labelsWithGraphics,
            },
          });
          toast({
            variant: "destructive",
            title: t('blockError'),
            description: t('blockErrorMessage', { block: batchIndex + 1 }),
            duration: 4000,
          });
        }
      }
    }
    
    onProgress(100);
    
    const pdfs = results.filter((pdf): pdf is Blob => pdf !== null);
    const totalTime = Date.now() - totalStartTime;

    // Labels that never made it into a PDF (their batch failed permanently)
    const missingLabels = results.reduce(
      (sum, result, index) => (result === null ? sum + batches[index].length : sum),
      0
    );
    
    console.log(`🏆 Conversion completed in ${totalTime}ms`);
    console.log(`📊 Final: ${pdfs.length}/${batches.length} batches successful, ${labels.length} labels processed`);
    
    if (pdfs.length < batches.length) {
      const missingBatches = batches.length - pdfs.length;
      console.warn(`⚠️ Warning: ${missingBatches} batches failed and were not included in the final PDF`);
      reportProcessingError({
        ...baseLogContext,
        errorType: 'labelary_partial_failure',
        message: `${missingBatches}/${batches.length} lotes ausentes no PDF final`,
        failedCount: missingBatches,
        processingTimeMs: totalTime,
        metadata: {
          totalBatches: batches.length,
          successfulBatches: pdfs.length,
          missingLabels,
          rateLimitHits,
          labelarySize,
          labelsWithGraphics,
        },
      });
    }

    return {
      pdfs,
      totalBatches: batches.length,
      failedBatches: batches.length - pdfs.length,
      missingLabels,
      rateLimitHits,
    };
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    const labels = parseZplBlocks(zplContent);
    console.log(`🔍 parseLabelsFromZpl: Found ${labels.length} blocks in ZPL content`);
    return labels;
  };

  const countLabelsInZpl = (zplContent: string): number => {
    return countZplLabelsWithLog(zplContent, 'useZplApiConversion');
  };

  return {
    convertZplBlocksToPdfs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
