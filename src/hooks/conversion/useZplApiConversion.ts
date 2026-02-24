import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { delay } from '@/utils/pdfUtils';
import { parseZplBlocks, countZplLabelsWithLog, calculateSafeBatchSize } from '@/utils/zplUtils';
import { DEFAULT_CONFIG, ProcessingMetricsTracker, ProcessingConfig } from '@/config/processingConfig';

export const useZplApiConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplBlocksToPdfs = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const totalStartTime = Date.now();
    
    // Adjust batch size based on ^PQ commands in the labels
    const effectiveBatchSize = calculateSafeBatchSize(labels, config.labelsPerBatch);
    const actualConfig = effectiveBatchSize < config.labelsPerBatch 
      ? { ...config, labelsPerBatch: effectiveBatchSize }
      : config;
    
    console.log(`🏁 Starting conversion of ${labels.length} labels with batch size ${actualConfig.labelsPerBatch}`);
    
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += actualConfig.labelsPerBatch) {
      batches.push(labels.slice(i, i + actualConfig.labelsPerBatch));
    }
    
    console.log(`📦 Created ${batches.length} batches of ~${actualConfig.labelsPerBatch} labels each`);
    
    const PARALLEL_BATCHES = 2; // Reduced from 3 to avoid rate limits
    const results: (Blob | null)[] = new Array(batches.length).fill(null);
    const failedBatches: number[] = [];
    let completed = 0;

    // Track last error context for metadata enrichment
    let lastErrorContext: { status?: number; body?: string; failureType?: string } = {};

    const processBatch = async (batchLabels: string[], batchIndex: number, maxRetries: number = actualConfig.maxRetries, baseDelay: number = actualConfig.delayBetweenBatches): Promise<Blob | null> => {
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const blockZPL = batchLabels.join('');

          // Explicit timeout with AbortController (30s)
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000);

          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.status === 429) {
            retryCount++;
            const waitTime = actualConfig.fallbackDelay * retryCount;
            console.log(`⏳ Rate limited on batch ${batchIndex + 1}, waiting ${waitTime}ms...`);
            lastErrorContext = { status: 429, body: 'Rate limit exceeded', failureType: 'rate_limit' };
            await delay(waitTime);
            continue;
          }

          if (response.status === 413) {
            const errorBody = await response.text().catch(() => 'Payload too large');
            console.error(`📏 Batch ${batchIndex + 1} exceeded Labelary limit (413). Labels in batch: ${batchLabels.length}`);
            lastErrorContext = { status: 413, body: errorBody.substring(0, 200), failureType: 'payload_too_large' };
            // Don't retry with same batch size - it will fail again
            return null;
          }

          if (response.status === 400) {
            const errorBody = await response.text().catch(() => 'Bad request');
            if (errorBody.includes('exceeds the maximum') || errorBody.includes('2 MB')) {
              console.warn(`📏 Batch ${batchIndex + 1} hit 2MB limit (${batchLabels.length} labels). Will attempt split.`);
              lastErrorContext = { status: 400, body: errorBody.substring(0, 200), failureType: 'image_size_limit' };
              // Signal caller to split batch
              const splitError = new Error(`Batch exceeds 2MB limit`);
              (splitError as any).splitRequired = true;
              (splitError as any).batchLabels = batchLabels;
              throw splitError;
            }
            lastErrorContext = { status: 400, body: errorBody.substring(0, 200), failureType: 'http_error' };
            throw new Error(`HTTP 400: ${errorBody.substring(0, 200)}`);
          }

          if (!response.ok) {
            const errorBody = await response.text().catch(() => 'Could not read body');
            lastErrorContext = { status: response.status, body: errorBody.substring(0, 200), failureType: 'http_error' };
            throw new Error(`HTTP ${response.status}: ${errorBody.substring(0, 200)}`);
          }

          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty PDF received');
          }
          
          console.log(`✅ Batch ${batchIndex + 1}/${batches.length} completed (${blob.size} bytes)`);
          return blob;
          
        } catch (error) {
          retryCount++;
          
          // Classify error type
          if (error instanceof DOMException && error.name === 'AbortError') {
            lastErrorContext = { failureType: 'timeout', body: 'Request timed out after 30s' };
            console.error(`⏰ Batch ${batchIndex + 1} attempt ${retryCount} timed out`);
          } else if (!lastErrorContext.failureType || lastErrorContext.failureType === 'rate_limit') {
            // Network error (no response received)
            if (error instanceof TypeError) {
              lastErrorContext = { failureType: 'network_error', body: error.message?.substring(0, 200) };
            }
            console.error(`❌ Batch ${batchIndex + 1} attempt ${retryCount} failed:`, error);
          } else {
            console.error(`❌ Batch ${batchIndex + 1} attempt ${retryCount} failed:`, error);
          }
          
          if (retryCount < maxRetries) {
            await delay(baseDelay * retryCount);
          }
        }
      }
      
      return null;
    };

    // Process batch with automatic splitting on 2MB limit
    const processBatchWithSplit = async (batchLabels: string[], batchIndex: number): Promise<Blob[]> => {
      try {
        const result = await processBatch(batchLabels, batchIndex);
        return result ? [result] : [];
      } catch (error: any) {
        if (error?.splitRequired && batchLabels.length > 1) {
          // Split batch in half and retry each half
          const mid = Math.ceil(batchLabels.length / 2);
          console.log(`✂️ Splitting batch ${batchIndex + 1} (${batchLabels.length} labels) into 2 sub-batches of ${mid} and ${batchLabels.length - mid}`);
          const left = await processBatchWithSplit(batchLabels.slice(0, mid), batchIndex);
          const right = await processBatchWithSplit(batchLabels.slice(mid), batchIndex);
          return [...left, ...right];
        } else if (error?.splitRequired && batchLabels.length === 1) {
          // Single label exceeds 2MB - cannot split further
          console.error(`💥 Single label exceeds 2MB limit at batch ${batchIndex + 1}`);
          lastErrorContext = { status: 400, body: 'Single label exceeds 2MB', failureType: 'image_size_limit' };
          const sizeError = new Error('Uma ou mais etiquetas contêm imagens muito grandes para processar (limite de 2MB da API).');
          (sizeError as any).apiContext = lastErrorContext;
          throw sizeError;
        }
        throw error;
      }
    };

    // Process batches in parallel groups
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
      const startIdx = i;
      
      const batchResults = await Promise.all(
        parallelBatches.map((batch, j) => processBatchWithSplit(batch, startIdx + j))
      );
      
      batchResults.forEach((subResults, j) => {
        if (subResults.length > 0) {
          // For split batches, store the first result at the original index
          // and append extra results to a separate array
          results[startIdx + j] = subResults[0];
          for (let k = 1; k < subResults.length; k++) {
            results.push(subResults[k]);
          }
        } else {
          failedBatches.push(startIdx + j);
        }
      });
      
      completed += parallelBatches.length;
      const progressValue = (completed / batches.length) * 90; // Reserve 10% for retry
      onProgress(progressValue);
      
      // Delay between parallel groups
      if (i + PARALLEL_BATCHES < batches.length) {
        await delay(actualConfig.delayBetweenBatches);
      }
    }
    
    // Retry failed batches sequentially with longer delays
    if (failedBatches.length > 0) {
      console.log(`🔄 Retrying ${failedBatches.length} failed batches sequentially...`);
      
      for (const batchIndex of failedBatches) {
        await delay(actualConfig.fallbackDelay); // Wait before retry
        
        const result = await processBatch(batches[batchIndex], batchIndex, 3, actualConfig.fallbackDelay);
        
        if (result) {
          results[batchIndex] = result;
          console.log(`✅ Batch ${batchIndex + 1} recovered successfully`);
        } else {
          console.error(`💥 Batch ${batchIndex + 1} permanently failed`);
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
    
    console.log(`🏆 Conversion completed in ${totalTime}ms`);
    console.log(`📊 Final: ${pdfs.length}/${batches.length} batches successful, ${labels.length} labels processed`);
    
    if (pdfs.length === 0) {
      const errorWithContext = new Error(`All ${batches.length} batches failed. No PDFs were generated after ${totalTime}ms. Labels attempted: ${labels.length}`);
      (errorWithContext as any).apiContext = lastErrorContext;
      throw errorWithContext;
    }
    
    if (pdfs.length < batches.length) {
      console.warn(`⚠️ Warning: ${batches.length - pdfs.length} batches failed and were not included in the final PDF`);
    }
    
    return pdfs;
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
