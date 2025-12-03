
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZPLIntoBlocks, delay } from '@/utils/pdfUtils';
import { DEFAULT_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useZplApiConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplBlocksToPngs = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const totalStartTime = Date.now();
    
    console.log(`🖼️ Starting PNG conversion of ${labels.length} labels with config:`, config);
    
    const results: (Blob | null)[] = new Array(labels.length).fill(null);
    const failedLabels: number[] = [];
    let completed = 0;

    const processLabel = async (label: string, labelIndex: number, maxRetries: number = config.maxRetries): Promise<Blob | null> => {
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
            method: 'POST',
            headers: {
              'Accept': 'image/png',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: label,
          });

          if (response.status === 429) {
            retryCount++;
            const waitTime = config.fallbackDelay * retryCount;
            console.log(`⏳ Rate limited on label ${labelIndex + 1}, waiting ${waitTime}ms...`);
            await delay(waitTime);
            continue;
          }

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty PNG received');
          }
          
          return blob;
          
        } catch (error) {
          retryCount++;
          console.error(`❌ Label ${labelIndex + 1} attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            await delay(config.delayBetweenBatches * retryCount);
          }
        }
      }
      
      return null;
    };

    // Process labels in parallel groups (semaphore pattern)
    const PARALLEL_LABELS = 5;
    
    for (let i = 0; i < labels.length; i += PARALLEL_LABELS) {
      const parallelLabels = labels.slice(i, i + PARALLEL_LABELS);
      const startIdx = i;
      
      const labelResults = await Promise.all(
        parallelLabels.map((label, j) => processLabel(label, startIdx + j))
      );
      
      labelResults.forEach((result, j) => {
        if (result) {
          results[startIdx + j] = result;
        } else {
          failedLabels.push(startIdx + j);
        }
      });
      
      completed += parallelLabels.length;
      const progressValue = (completed / labels.length) * 100;
      onProgress(progressValue);
      
      // Small delay between groups to avoid rate limits
      if (i + PARALLEL_LABELS < labels.length) {
        await delay(200);
      }
    }
    
    // Retry failed labels
    if (failedLabels.length > 0) {
      console.log(`🔄 Retrying ${failedLabels.length} failed labels...`);
      
      for (const labelIndex of failedLabels) {
        await delay(config.fallbackDelay);
        
        const result = await processLabel(labels[labelIndex], labelIndex, 3);
        
        if (result) {
          results[labelIndex] = result;
          console.log(`✅ Label ${labelIndex + 1} recovered`);
        } else {
          console.error(`💥 Label ${labelIndex + 1} permanently failed`);
        }
      }
    }
    
    const pngs = results.filter((png): png is Blob => png !== null);
    const totalTime = Date.now() - totalStartTime;
    
    console.log(`🏆 PNG conversion completed in ${totalTime}ms: ${pngs.length}/${labels.length} successful`);
    
    return pngs;
  };

  const convertZplBlocksToPdfs = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const totalStartTime = Date.now();
    
    console.log(`🏁 Starting conversion of ${labels.length} labels with config:`, config);
    
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += config.labelsPerBatch) {
      batches.push(labels.slice(i, i + config.labelsPerBatch));
    }
    
    console.log(`📦 Created ${batches.length} batches of ~${config.labelsPerBatch} labels each`);
    
    const PARALLEL_BATCHES = 2; // Reduced from 3 to avoid rate limits
    const results: (Blob | null)[] = new Array(batches.length).fill(null);
    const failedBatches: number[] = [];
    let completed = 0;

    const processBatch = async (batchLabels: string[], batchIndex: number, maxRetries: number = config.maxRetries, baseDelay: number = config.delayBetweenBatches): Promise<Blob | null> => {
      let retryCount = 0;
      
      while (retryCount < maxRetries) {
        try {
          const blockZPL = batchLabels.join('');

          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
          });

          if (response.status === 429) {
            retryCount++;
            const waitTime = config.fallbackDelay * retryCount;
            console.log(`⏳ Rate limited on batch ${batchIndex + 1}, waiting ${waitTime}ms...`);
            await delay(waitTime);
            continue;
          }

          if (!response.ok) {
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
          console.error(`❌ Batch ${batchIndex + 1} attempt ${retryCount} failed:`, error);
          
          if (retryCount < maxRetries) {
            await delay(baseDelay * retryCount);
          }
        }
      }
      
      return null;
    };

    // Process batches in parallel groups
    for (let i = 0; i < batches.length; i += PARALLEL_BATCHES) {
      const parallelBatches = batches.slice(i, i + PARALLEL_BATCHES);
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
      
      // Delay between parallel groups
      if (i + PARALLEL_BATCHES < batches.length) {
        await delay(config.delayBetweenBatches);
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
    
    if (pdfs.length < batches.length) {
      console.warn(`⚠️ Warning: ${batches.length - pdfs.length} batches failed and were not included in the final PDF`);
    }
    
    return pdfs;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    const labels = splitZPLIntoBlocks(zplContent);
    console.log(`🔍 parseLabelsFromZpl: Found ${labels.length} labels in ZPL content`);
    return labels;
  };

  const countLabelsInZpl = (zplContent: string): number => {
    const labels = splitZPLIntoBlocks(zplContent);
    // Divide by 2 to get the correct count as each label has 2 ^XA markers
    const correctCount = Math.ceil(labels.length / 2);
    console.log(`🔢 countLabelsInZpl: Counted ${correctCount} labels in ZPL content (${labels.length} blocks / 2)`);
    return correctCount;
  };

  return {
    convertZplBlocksToPngs,
    convertZplBlocksToPdfs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
