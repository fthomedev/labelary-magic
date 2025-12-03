
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZPLIntoBlocks, delay } from '@/utils/pdfUtils';
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
    
    console.log(`🏁 Starting conversion of ${labels.length} labels with config:`, config);
    
    // Create batches
    const batches: string[][] = [];
    for (let i = 0; i < labels.length; i += config.labelsPerBatch) {
      batches.push(labels.slice(i, i + config.labelsPerBatch));
    }
    
    console.log(`📦 Created ${batches.length} batches of ~${config.labelsPerBatch} labels each`);
    
    const PARALLEL_BATCHES = 3; // Process 3 batches in parallel
    const results: (Blob | null)[] = new Array(batches.length).fill(null);
    let completed = 0;

    const processBatch = async (batchLabels: string[], batchIndex: number): Promise<Blob | null> => {
      let retryCount = 0;
      
      while (retryCount < config.maxRetries) {
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
          
          if (retryCount < config.maxRetries) {
            await delay(config.delayBetweenBatches * retryCount);
          }
        }
      }
      
      console.error(`💥 Batch ${batchIndex + 1} failed after ${config.maxRetries} attempts`);
      toast({
        variant: "destructive",
        title: t('blockError'),
        description: t('blockErrorMessage', { block: batchIndex + 1 }),
        duration: 4000,
      });
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
        results[startIdx + j] = result;
      });
      
      completed += parallelBatches.length;
      const progressValue = (completed / batches.length) * 100;
      onProgress(progressValue);
      
      // Small delay between parallel groups
      if (i + PARALLEL_BATCHES < batches.length) {
        await delay(config.delayBetweenBatches);
      }
    }
    
    const pdfs = results.filter((pdf): pdf is Blob => pdf !== null);
    const totalTime = Date.now() - totalStartTime;
    
    console.log(`🏆 Conversion completed in ${totalTime}ms`);
    console.log(`📊 Final: ${pdfs.length}/${batches.length} batches successful, ${labels.length} labels processed`);
    
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
    convertZplBlocksToPdfs,
    parseLabelsFromZpl,
    countLabelsInZpl
  };
};
