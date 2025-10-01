
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplLabelProcessor } from './useZplLabelProcessor';
import { useZplValidator } from './useZplValidator';
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';

/**
 * Otimiza o código ZPL para melhor qualidade de impressão
 * Adiciona comandos para melhorar resolução, fontes e códigos de barras
 * Aumenta fontes em 1,5x e usa fontes escaláveis quando possível
 */
const optimizeZplForQuality = (zpl: string): string => {
  // Adiciona ^PMB (print mode bold) logo após ^XA para engrossar textos
  let optimizedZpl = zpl.replace(/\^XA/g, '^XA^PMB');
  
  // Melhora códigos de barras adicionando ^BY3,3,120 antes de códigos de barras comuns
  // ^BC = Code 128, ^B3 = Code 39, ^BQ = QR Code, ^BY = Bar width (mais largo e alto)
  optimizedZpl = optimizedZpl.replace(/(\^BC|\^B3|\^BQ)/g, '^BY3,3,120$1');
  
  // Substitui fontes fixas por fonte escalável TrueType quando possível
  // ^A0 → ^A@ (fonte escalável) com tamanho aumentado em 1,5x
  optimizedZpl = optimizedZpl.replace(/\^A0N,(\d+),(\d+)/g, (match, h, w) => {
    const height = Math.max(Math.round(parseInt(h) * 1.5), 45);
    const width = Math.max(Math.round(parseInt(w) * 1.5), 45);
    return `^A@N,${height},${width},E:TT0003M_.FNT`;
  });
  
  // Melhora outras fontes fixas (A-Z) aumentando em 1,5x
  optimizedZpl = optimizedZpl.replace(/\^A([A-Z])N,(\d+),(\d+)/g, (match, font, h, w) => {
    const height = Math.max(Math.round(parseInt(h) * 1.5), 38);
    const width = Math.max(Math.round(parseInt(w) * 1.5), 38);
    return `^A${font}N,${height},${width}`;
  });
  
  // Se não houver fontes especificadas, adiciona fonte escalável padrão após ^PMB
  if (!optimizedZpl.includes('^A')) {
    optimizedZpl = optimizedZpl.replace(/\^PMB/g, '^PMB^A@N,45,45,E:TT0003M_.FNT');
  }
  
  return optimizedZpl;
};

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

    const images: Blob[] = [];
    
    console.log(`🖼️ Starting A4 PNG conversion of ${validLabels.length} valid labels with Cenário 2 batch processing`);
    console.log(`⚡ Using A4 Cenário 2 configuration:`, config);
    
    let currentConfig = { ...config };
    let consecutiveErrors = 0;
    let successfulBatches = 0;
    
    // Process labels in batches with Cenário 2 settings
    for (let i = 0; i < validLabels.length; i += currentConfig.labelsPerBatch) {
      const batchLabels = validLabels.slice(i, i + currentConfig.labelsPerBatch);
      const batchNumber = Math.floor(i / currentConfig.labelsPerBatch) + 1;
      const totalBatches = Math.ceil(validLabels.length / currentConfig.labelsPerBatch);
      
      console.log(`📦 Processing A4 batch ${batchNumber}/${totalBatches} (${batchLabels.length} labels) - Cenário 2`);
      
      let batchSuccess = false;
      let retryCount = 0;
      
      while (!batchSuccess && retryCount < currentConfig.maxRetries) {
        try {
          // Process each label in the current batch
          for (let j = 0; j < batchLabels.length; j++) {
            const label = batchLabels[j];
            const labelNumber = i + j + 1;
            
            console.log(`🔄 Processing A4 label ${labelNumber}/${validLabels.length} in batch ${batchNumber}...`);
            
            // Otimiza o ZPL para melhor qualidade antes de enviar
            const optimizedLabel = optimizeZplForQuality(label);
            
            // Usa 12dpmm (300 dpi) para melhor resolução (mantém PNG para A4)
            const response = await fetch('https://api.labelary.com/v1/printers/12dpmm/labels/4x6/0/', {
              method: 'POST',
              headers: {
                'Accept': 'image/png',
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: optimizedLabel,
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
              await new Promise(resolve => setTimeout(resolve, 150)); // Slightly increased delay
            }
          }
          
          batchSuccess = true;
          successfulBatches++;
          consecutiveErrors = 0;
          
          const progressValue = ((i + batchLabels.length) / validLabels.length) * 80; // Reserve 20% for PDF generation
          onProgress(progressValue);
          
          console.log(`✅ A4 Batch ${batchNumber} completed successfully (${batchLabels.length} labels) - Cenário 2`);
          
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
            // Continue with next batch instead of throwing
          }
        }
      }
      
      // Check if we should switch to fallback mode
      if (consecutiveErrors >= 2) {
        console.log(`⚠️ A4 processing switching to fallback mode due to high error rate`);
        currentConfig = {
          ...currentConfig,
          delayBetweenBatches: currentConfig.fallbackDelay,
          labelsPerBatch: Math.max(currentConfig.labelsPerBatch - 5, 10), // More conservative fallback
        };
        consecutiveErrors = 0;
      }
      
      // Add delay between batches (Cenário 2: 1000ms)
      if (i + currentConfig.labelsPerBatch < validLabels.length) {
        console.log(`⏱️ A4 waiting ${currentConfig.delayBetweenBatches}ms before next batch (Cenário 2)...`);
        await new Promise(resolve => setTimeout(resolve, currentConfig.delayBetweenBatches));
      }
    }
    
    console.log(`🎯 A4 PNG conversion summary: ${images.length}/${validLabels.length} images generated successfully`);
    console.log(`📊 A4 batch processing stats: ${successfulBatches} successful batches with Cenário 2`);
    
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
