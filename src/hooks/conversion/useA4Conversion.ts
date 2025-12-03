
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { splitZplIntoLabels } = useZplLabelProcessor();
  const { filterValidLabels } = useZplValidator();

  const convertSingleLabel = async (label: string, index: number, total: number): Promise<Blob | null> => {
    const maxRetries = 3;
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
          const waitTime = 2000 * retryCount;
          console.log(`⏳ Rate limited on label ${index + 1}, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (blob.size === 0) throw new Error('Empty PNG');
        
        console.log(`✅ Label ${index + 1}/${total} (${blob.size} bytes)`);
        return blob;
        
      } catch (error) {
        retryCount++;
        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
        }
      }
    }
    console.error(`❌ Label ${index + 1} failed after ${maxRetries} attempts`);
    return null;
  };

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = A4_CONFIG
  ): Promise<Blob[]> => {
    const validLabels = filterValidLabels(labels);
    
    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    const images: (Blob | null)[] = [];
    const PARALLEL_BATCH_SIZE = 4; // Process 4 labels in parallel
    
    console.log(`🖼️ Starting A4 conversion of ${validLabels.length} labels (parallel batches of ${PARALLEL_BATCH_SIZE})`);
    
    for (let i = 0; i < validLabels.length; i += PARALLEL_BATCH_SIZE) {
      const batch = validLabels.slice(i, i + PARALLEL_BATCH_SIZE);
      const batchNum = Math.floor(i / PARALLEL_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(validLabels.length / PARALLEL_BATCH_SIZE);
      
      console.log(`📦 Batch ${batchNum}/${totalBatches} (${batch.length} labels in parallel)`);
      
      // Process batch in parallel
      const batchResults = await Promise.all(
        batch.map((label, j) => convertSingleLabel(label, i + j, validLabels.length))
      );
      
      images.push(...batchResults);
      
      // Update progress (0-80%)
      const progressValue = ((i + batch.length) / validLabels.length) * 80;
      onProgress(progressValue);
      
      // Small delay between batches to avoid rate limits
      if (i + PARALLEL_BATCH_SIZE < validLabels.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    const finalImages = images.filter((img): img is Blob => img !== null);
    console.log(`🎯 A4 conversion complete: ${finalImages.length}/${validLabels.length} images`);
    
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
