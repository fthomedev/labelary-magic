
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

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = A4_CONFIG
  ): Promise<Blob[]> => {
    // Filter out invalid labels before processing
    const validLabels = filterValidLabels(labels);
    
    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    const images: Blob[] = new Array(validLabels.length);
    const processed = new Set<number>();
    
    console.log(`🖼️ Starting A4 PNG conversion of ${validLabels.length} valid labels`);
    
    // Process labels one by one with proper delay to avoid rate limits
    for (let i = 0; i < validLabels.length; i++) {
      if (processed.has(i)) continue;
      
      const label = validLabels[i];
      let retryCount = 0;
      let success = false;
      
      while (!success && retryCount < config.maxRetries) {
        try {
          console.log(`🔄 Processing A4 label ${i + 1}/${validLabels.length}...`);
          
          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
            method: 'POST',
            headers: {
              'Accept': 'image/png',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: label,
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ A4 Label ${i + 1} HTTP error: ${response.status}`);
            
            // On rate limit, wait longer
            if (response.status === 429) {
              const waitTime = 3000 * (retryCount + 1);
              console.log(`⏳ Rate limited, waiting ${waitTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
            }
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty PNG received from API');
          }
          
          images[i] = blob;
          processed.add(i);
          success = true;
          
          console.log(`✅ A4 Label ${i + 1}/${validLabels.length} converted (${blob.size} bytes)`);
          
          // Update progress (0-80%)
          const progressValue = ((i + 1) / validLabels.length) * 80;
          onProgress(progressValue);
          
          // Add delay between requests to avoid rate limits
          if (i < validLabels.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
          
        } catch (error) {
          retryCount++;
          console.error(`💥 A4 Label ${i + 1} attempt ${retryCount}/${config.maxRetries} failed`);
          
          if (retryCount < config.maxRetries) {
            const retryDelay = config.delayBetweenBatches * retryCount;
            console.log(`⏳ Retrying in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
    }
    
    // Filter out any unprocessed slots
    const finalImages = images.filter(img => img !== undefined);
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
