
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZPLIntoBlocks, delay } from '@/utils/pdfUtils';
import { DEFAULT_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const images: Blob[] = [];
    
    console.log(`🖼️ Starting A4 PNG conversion of ${labels.length} labels`);
    
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      let retryCount = 0;
      let success = false;
      
      while (!success && retryCount < config.maxRetries) {
        try {
          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'image/png',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: label,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          if (blob.size === 0) {
            throw new Error('Empty PNG received');
          }
          
          images.push(blob);
          success = true;
          
          const progressValue = ((i + 1) / labels.length) * 80; // Reserve 20% for PDF generation
          onProgress(progressValue);
          
          console.log(`✅ Label ${i + 1}/${labels.length} converted to PNG`);
          
        } catch (error) {
          retryCount++;
          console.error(`❌ Label ${i + 1} attempt ${retryCount} failed:`, error);
          
          if (retryCount < config.maxRetries) {
            await delay(config.delayBetweenBatches);
          } else {
            console.error(`💥 Label ${i + 1} failed after ${config.maxRetries} attempts`);
            toast({
              variant: "destructive",
              title: t('error'),
              description: `Error converting label ${i + 1}`,
              duration: 4000,
            });
          }
        }
      }
      
      // Add delay between requests (except for the last one)
      if (i < labels.length - 1) {
        await delay(config.delayBetweenBatches);
      }
    }
    
    console.log(`🖼️ PNG conversion completed: ${images.length} images generated`);
    return images;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    const labels = splitZPLIntoBlocks(zplContent);
    console.log(`🔍 parseLabelsFromZpl for A4: Found ${labels.length} labels`);
    return labels;
  };

  return {
    convertZplToA4Images,
    parseLabelsFromZpl
  };
};
