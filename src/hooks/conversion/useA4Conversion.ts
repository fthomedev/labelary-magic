
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { splitZplIntoLabels } = useZplLabelProcessor();
  const { filterValidLabels } = useZplValidator();

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    // Filter out invalid labels before processing
    const validLabels = filterValidLabels(labels);
    
    if (validLabels.length === 0) {
      throw new Error('Nenhuma etiqueta válida encontrada para processamento');
    }

    if (validLabels.length !== labels.length) {
      const skippedCount = labels.length - validLabels.length;
      toast({
        title: 'Etiquetas Filtradas',
        description: `${skippedCount} etiquetas inválidas foram ignoradas. Processando ${validLabels.length} etiquetas válidas.`,
        duration: 4000,
      });
    }

    const images: Blob[] = [];
    
    console.log(`🖼️ Starting A4 PNG conversion of ${validLabels.length} valid labels with batch processing`);
    console.log(`⚡ Using batch configuration:`, config);
    
    let currentConfig = { ...config };
    let consecutiveErrors = 0;
    let successfulBatches = 0;
    
    // Process labels in batches like the standard system
    for (let i = 0; i < validLabels.length; i += currentConfig.labelsPerBatch) {
      const batchLabels = validLabels.slice(i, i + currentConfig.labelsPerBatch);
      const batchNumber = Math.floor(i / currentConfig.labelsPerBatch) + 1;
      const totalBatches = Math.ceil(validLabels.length / currentConfig.labelsPerBatch);
      
      console.log(`📦 Processing A4 batch ${batchNumber}/${totalBatches} (${batchLabels.length} labels)`);
      
      let batchSuccess = false;
      let retryCount = 0;
      
      while (!batchSuccess && retryCount < currentConfig.maxRetries) {
        try {
          // Process each label in the current batch
          for (let j = 0; j < batchLabels.length; j++) {
            const label = batchLabels[j];
            const labelNumber = i + j + 1;
            
            console.log(`🔄 Processing A4 label ${labelNumber}/${validLabels.length} in batch ${batchNumber}...`);
            
            const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
              method: 'POST',
              headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: label,
            });

            console.log(`📡 API Response for A4 label ${labelNumber}: ${response.status} ${response.statusText}`);

            if (!response.ok) {
              const errorText = await response.text();
              console.error(`❌ A4 Label ${labelNumber} HTTP error:`, {
                status: response.status,
                statusText: response.statusText,
                errorText: errorText.substring(0, 200)
              });
              throw new Error(`HTTP ${response.status}: ${errorText}`);
            }

            const blob = await response.blob();
            console.log(`📦 Received A4 blob for label ${labelNumber}:`, {
              size: blob.size,
              type: blob.type
            });
            
            if (blob.size === 0) {
              throw new Error('Empty PNG received from API');
            }
            
            images.push(blob);
            console.log(`✅ A4 Label ${labelNumber}/${validLabels.length} converted successfully (${blob.size} bytes)`);
            
            // Add small delay between individual labels within a batch
            if (j < batchLabels.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 100));
            }
          }
          
          batchSuccess = true;
          successfulBatches++;
          consecutiveErrors = 0;
          
          const progressValue = ((i + batchLabels.length) / validLabels.length) * 80; // Reserve 20% for PDF generation
          onProgress(progressValue);
          
          console.log(`✅ A4 Batch ${batchNumber} completed successfully (${batchLabels.length} labels)`);
          
        } catch (error) {
          retryCount++;
          consecutiveErrors++;
          
          console.error(`💥 A4 Batch ${batchNumber} attempt ${retryCount}/${currentConfig.maxRetries} failed:`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          });
          
          if (retryCount < currentConfig.maxRetries) {
            const retryDelay = currentConfig.delayBetweenBatches * retryCount;
            console.log(`⏳ Retrying A4 batch ${batchNumber} in ${retryDelay}ms...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          } else {
            console.error(`💀 A4 Batch ${batchNumber} permanently failed after ${currentConfig.maxRetries} attempts`);
            toast({
              variant: "destructive",
              title: t('error'),
              description: `Erro no lote A4 ${batchNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              duration: 4000,
            });
          }
        }
      }
      
      // Check if we should switch to fallback mode
      if (consecutiveErrors >= 2) {
        console.log(`⚠️ A4 processing switching to fallback mode due to high error rate`);
        currentConfig = {
          ...currentConfig,
          delayBetweenBatches: currentConfig.fallbackDelay,
          labelsPerBatch: Math.max(currentConfig.labelsPerBatch - 2, 5),
        };
        consecutiveErrors = 0;
      }
      
      // Add delay between batches (except for the last batch)
      if (i + currentConfig.labelsPerBatch < validLabels.length) {
        console.log(`⏱️ A4 waiting ${currentConfig.delayBetweenBatches}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, currentConfig.delayBetweenBatches));
      }
    }
    
    console.log(`🎯 A4 PNG conversion summary: ${images.length}/${validLabels.length} images generated successfully`);
    console.log(`📊 A4 batch processing stats: ${successfulBatches} successful batches`);
    
    return images;
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
