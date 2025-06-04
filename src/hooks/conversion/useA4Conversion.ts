
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
    
    console.log(`🖼️ Starting A4 PNG conversion of ${labels.length} labels with pre-validation and logging`);
    
    // Pre-validate all labels
    const validationResults = validateAllLabels(labels);
    const validLabelIndices = validationResults
      .filter(r => r.isValid)
      .map(r => r.labelNumber - 1);
    
    console.log(`✅ Pre-validation complete: ${validLabelIndices.length}/${labels.length} labels are valid`);
    
    if (validLabelIndices.length === 0) {
      throw new Error('No valid ZPL labels found after validation');
    }
    
    for (let i = 0; i < labels.length; i++) {
      const label = labels[i];
      const labelNumber = i + 1;
      const startTime = Date.now();
      
      console.log(`🔄 Processing label ${labelNumber}/${labels.length}...`);
      
      // Skip invalid labels and log them
      if (!validLabelIndices.includes(i)) {
        const processingTime = Date.now() - startTime;
        const validationResult = validationResults.find(r => r.labelNumber === labelNumber);
        
        console.log(`⏭️ Skipping label ${labelNumber} (failed validation): ${validationResult?.errors.join(', ')}`);
        
        // Log the skipped label
        await createProcessingLog({
          label_number: labelNumber,
          zpl_content: label,
          status: 'skipped',
          error_message: `Validation failed: ${validationResult?.errors.join(', ')}`,
          validation_warnings: validationResult?.warnings || [],
          processing_time_ms: processingTime
        });
        
        const progressValue = ((i + 1) / labels.length) * 80;
        onProgress(progressValue);
        continue;
      }
      
      console.log(`📝 ZPL content (${label.length} chars): ${label.substring(0, 100)}...`);
      
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
              headers: Object.fromEntries(response.headers.entries()),
              body: errorText.substring(0, 200)
            });
            
            const processingTime = Date.now() - startTime;
            
            // Log the failed attempt
            await createProcessingLog({
              label_number: labelNumber,
              zpl_content: label,
              status: 'failed',
              error_message: `HTTP ${response.status}: ${errorText}`,
              api_response_status: response.status,
              api_response_body: errorText,
              processing_time_ms: processingTime
            });
            
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const blob = await response.blob();
          console.log(`📦 Received blob for label ${labelNumber}:`, {
            size: blob.size,
            type: blob.type
          });
          
          if (blob.size === 0) {
            throw new Error('Empty PNG received from API');
          }
          
          images.push(blob);
          success = true;
          
          const processingTime = Date.now() - startTime;
          
          // Log successful processing
          await createProcessingLog({
            label_number: labelNumber,
            zpl_content: label,
            status: 'success',
            api_response_status: response.status,
            processing_time_ms: processingTime
          });
          
          const progressValue = ((i + 1) / labels.length) * 80; // Reserve 20% for PDF generation
          onProgress(progressValue);
          
          console.log(`✅ Label ${labelNumber}/${labels.length} converted successfully (${blob.size} bytes)`);
          
        } catch (error) {
          retryCount++;
          const processingTime = Date.now() - startTime;
          
          console.error(`💥 Label ${labelNumber} attempt ${retryCount}/${config.maxRetries} failed:`, {
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : undefined
          });
          
          if (retryCount < config.maxRetries) {
            console.log(`⏳ Retrying label ${labelNumber} in ${config.delayBetweenBatches}ms...`);
            await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
          } else {
            console.error(`💀 Label ${labelNumber} permanently failed after ${config.maxRetries} attempts`);
            
            // Log the permanently failed label
            await createProcessingLog({
              label_number: labelNumber,
              zpl_content: label,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error',
              processing_time_ms: processingTime
            });
            
            toast({
              variant: "destructive",
              title: t('error'),
              description: `Erro na etiqueta ${labelNumber}: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
              duration: 4000,
            });
          }
        }
      }
      
      // Add delay between requests (except for the last one)
      if (i < labels.length - 1) {
        console.log(`⏸️ Waiting ${config.delayBetweenBatches}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, config.delayBetweenBatches));
      }
    }
    
    console.log(`🎯 PNG conversion summary: ${images.length}/${labels.length} images generated successfully`);
    return images;
  };

  const parseLabelsFromZpl = (zplContent: string) => {
    console.log('🔍 Parsing ZPL content for A4 processing...');
    const labels = splitZplIntoLabels(zplContent);
    console.log(`📋 parseLabelsFromZpl for A4: Found ${labels.length} labels`);
    
    // Log first few characters of each label for debugging
    labels.forEach((label, index) => {
      console.log(`📄 Label ${index + 1}: ${label.substring(0, 50)}...`);
    });
    
    return labels;
  };

  return {
    convertZplToA4Images,
    parseLabelsFromZpl
  };
};
