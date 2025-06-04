import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZplIntoLabels } from '@/utils/zplSplitter';
import { useZplValidator } from './useZplValidator';
import { createProcessingLog } from '@/utils/processingLogger';
import { DEFAULT_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useA4Conversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { validateAllLabels } = useZplValidator();

  const convertZplToA4Images = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const images: Blob[] = [];
    
    console.log(`🖼️ Starting A4 PNG conversion of ${labels.length} labels with enhanced validation and logging`);
    
    // Pre-validate all labels with detailed logging
    const validationResults = validateAllLabels(labels);
    const validLabelIndices = validationResults
      .filter(r => r.isValid)
      .map(r => r.labelNumber - 1);
    
    const invalidCount = labels.length - validLabelIndices.length;
    console.log(`✅ Pre-validation complete: ${validLabelIndices.length}/${labels.length} labels are valid (${invalidCount} invalid/skipped)`);
    
    if (validLabelIndices.length === 0) {
      console.error('❌ No valid ZPL labels found after validation');
      throw new Error('Nenhuma etiqueta ZPL válida encontrada. Verifique o conteúdo do arquivo.');
    }
    
    // Show warning if many labels are invalid
    if (invalidCount > 0) {
      console.warn(`⚠️ ${invalidCount} etiquetas serão ignoradas por serem inválidas ou muito curtas`);
      toast({
        variant: "destructive",
        title: "Aviso de Validação",
        description: `${invalidCount} etiquetas inválidas foram ignoradas automaticamente`,
        duration: 5000,
      });
    }
    
    let successCount = 0;
    let skipCount = 0;
    let failureCount = 0;
    
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelNumber = i + 1;
      const startTime = Date.now();
      
      console.log(`🔄 Processing label ${labelNumber}/${labels.length}...`);
      
      // Skip invalid labels and log them
      if (!validLabelIndices.includes(i)) {
        const processingTime = Date.now() - startTime;
        const validationResult = validationResults.find(r => r.labelNumber === labelNumber);
        
        console.log(`⏭️ Skipping label ${labelNumber} (validation failed): ${validationResult?.errors.join(', ')}`);
        
        // Log the skipped label with enhanced debugging
        console.log(`📝 About to log skipped label ${labelNumber}...`);
        try {
          await createProcessingLog({
            label_number: labelNumber,
            zpl_content: label,
            status: 'skipped',
            error_message: `Validation failed: ${validationResult?.errors.join(', ')}`,
            validation_warnings: validationResult?.warnings || [],
            processing_time_ms: processingTime
          });
          console.log(`✅ Successfully logged skipped label ${labelNumber}`);
        } catch (logError) {
          console.error(`❌ Failed to log skipped label ${labelNumber}:`, logError);
        }
        
        skipCount++;
        const progressValue = ((i + 1) / labels.length) * 80;
        onProgress(progressValue);
        continue;
      }
      
      console.log(`📝 Processing valid ZPL (${label.length} chars)`);
      
      let retryCount = 0;
      let success = false;
      
      while (!success && retryCount < config.maxRetries) {
        try {
          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
            method: 'POST',
            headers: {
              'Accept': 'image/png',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: label,
          });

          console.log(`📡 API Response for label ${labelNumber}: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ Label ${labelNumber} HTTP error:`, {
              status: response.status,
              statusText: response.statusText,
              errorBody: errorText.substring(0, 200)
            });
            
            const processingTime = Date.now() - startTime;
            
            // Log the failed attempt with enhanced debugging
            console.log(`📝 About to log failed label ${labelNumber}...`);
            try {
              await createProcessingLog({
                label_number: labelNumber,
                zpl_content: label,
                status: 'failed',
                error_message: `HTTP ${response.status}: ${errorText}`,
                api_response_status: response.status,
                api_response_body: errorText,
                processing_time_ms: processingTime
              });
              console.log(`✅ Successfully logged failed label ${labelNumber}`);
            } catch (logError) {
              console.error(`❌ Failed to log failed label ${labelNumber}:`, logError);
            }
            
            throw new Error(`Falha na API (Etiqueta ${labelNumber}): HTTP ${response.status}`);
          }

          const blob = await response.blob();
          console.log(`📦 Received blob for label ${labelNumber}: ${blob.size} bytes`);
          
          if (blob.size === 0) {
            throw new Error(`PNG vazio recebido da API para etiqueta ${labelNumber}`);
          }
          
          images.push(blob);
          success = true;
          successCount++;
          
          const processingTime = Date.now() - startTime;
          
          // Log successful processing with enhanced debugging
          console.log(`📝 About to log successful label ${labelNumber}...`);
          try {
            await createProcessingLog({
              label_number: labelNumber,
              zpl_content: label,
              status: 'success',
              api_response_status: response.status,
              processing_time_ms: processingTime
            });
            console.log(`✅ Successfully logged successful label ${labelNumber}`);
          } catch (logError) {
            console.error(`❌ Failed to log successful label ${labelNumber}:`, logError);
          }
          
          const progressValue = ((i + 1) / labels.length) * 80;
          onProgress(progressValue);
          
          console.log(`✅ Label ${labelNumber}/${labels.length} converted successfully`);
          
        } catch (error) {
          retryCount++;
          const processingTime = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
          
          console.error(`💥 Label ${labelNumber} attempt ${retryCount}/${config.maxRetries} failed:`, errorMessage);
          
          if (retryCount < config.maxRetries) {
            console.log(`⏳ Retrying label ${labelNumber} in ${config.delayBetweenBatches}ms...`);
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
          } else {
            console.error(`💀 Label ${labelNumber} permanently failed after ${config.maxRetries} attempts`);
            failureCount++;
            
            // Log the permanently failed label with enhanced debugging
            console.log(`📝 About to log permanently failed label ${labelNumber}...`);
            try {
              await createProcessingLog({
                label_number: labelNumber,
                zpl_content: label,
                status: 'failed',
                error_message: errorMessage,
                processing_time_ms: processingTime
              });
              console.log(`✅ Successfully logged permanently failed label ${labelNumber}`);
            } catch (logError) {
              console.error(`❌ Failed to log permanently failed label ${labelNumber}:`, logError);
            }
            
            // Don't show individual toast for each failure, we'll show summary
            console.warn(`Etiqueta ${labelNumber} falhou permanentemente: ${errorMessage}`);
          }
        }
      }
      
      // Add delay between requests (except for the last one)
      if (i < labels.length - 1) {
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }
    
    // Show summary results
    console.log(`🎯 A4 conversion summary: ${successCount} success, ${skipCount} skipped, ${failureCount} failed`);
    
    if (images.length === 0) {
      throw new Error('Nenhuma imagem foi gerada com sucesso. Verifique o conteúdo ZPL.');
    }
    
    if (failureCount > 0) {
      toast({
        variant: "destructive",
        title: "Aviso de Processamento",
        description: `${failureCount} etiquetas falharam durante o processamento`,
        duration: 4000,
      });
    }
    
    return images;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for A4 processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for A4: Found ${labels.length} labels`);
    
    // Log first few characters of each label for debugging
    labels.forEach((label, index) => {
      const preview = label.substring(0, 50).replace(/\s+/g, ' ');
      console.log(`📄 Label ${index + 1}: ${preview}...`);
    });
    
    return labels;
  };

  return {
    convertZplToA4Images,
    parseLabelsFromZpl
  };
};
