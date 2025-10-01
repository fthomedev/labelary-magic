
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { splitZPLIntoBlocks, delay } from '@/utils/pdfUtils';
import { DEFAULT_CONFIG, ProcessingMetricsTracker, ProcessingConfig } from '@/config/processingConfig';

/**
 * Otimiza o código ZPL para melhor qualidade de impressão
 * Adiciona comandos para melhorar resolução, fontes e códigos de barras
 */
const optimizeZplForQuality = (zpl: string): string => {
  // Adiciona ^PMB (print mode bold) logo após ^XA para engrossar textos
  let optimizedZpl = zpl.replace(/\^XA/g, '^XA^PMB');
  
  // Melhora códigos de barras adicionando ^BY3,3,100 antes de códigos de barras comuns
  // ^BC = Code 128, ^B3 = Code 39, ^BQ = QR Code, ^BY = Bar width
  optimizedZpl = optimizedZpl.replace(/(\^BC|\^B3|\^BQ)/g, '^BY3,3,100$1');
  
  // Ajusta fontes pequenas para tamanho mínimo legível
  // ^A0 é fonte padrão, garantir mínimo de 30,30 para boa legibilidade
  optimizedZpl = optimizedZpl.replace(/\^A0N,(\d+),(\d+)/g, (match, h, w) => {
    const height = Math.max(parseInt(h), 30);
    const width = Math.max(parseInt(w), 30);
    return `^A0N,${height},${width}`;
  });
  
  // Melhora outras fontes fixas (A-Z) para tamanhos mínimos
  optimizedZpl = optimizedZpl.replace(/\^A([A-Z])N,(\d+),(\d+)/g, (match, font, h, w) => {
    const height = Math.max(parseInt(h), 25);
    const width = Math.max(parseInt(w), 25);
    return `^A${font}N,${height},${width}`;
  });
  
  return optimizedZpl;
};

export const useZplApiConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertZplBlocksToPdfs = async (
    labels: string[],
    onProgress: (progress: number) => void,
    config: ProcessingConfig = DEFAULT_CONFIG
  ): Promise<Blob[]> => {
    const pdfs: Blob[] = [];
    const metricsTracker = new ProcessingMetricsTracker(config);
    const totalStartTime = Date.now();
    
    console.log(`🏁 Starting conversion of ${labels.length} labels with config:`, config);
    console.log(`🔢 Input labels array length: ${labels.length}`);
    
    let currentConfig = { ...config };
    let consecutiveErrors = 0;
    let successfulBatches = 0;
    
    for (let i = 0; i < labels.length; i += currentConfig.labelsPerBatch) {
      const blockLabels = labels.slice(i, i + currentConfig.labelsPerBatch);
      const batchNumber = Math.floor(i / currentConfig.labelsPerBatch) + 1;
      const totalBatches = Math.ceil(labels.length / currentConfig.labelsPerBatch);
      
      console.log(`📦 Processing batch ${batchNumber}/${totalBatches} (${blockLabels.length} labels)`);
      
      const batchStartTime = metricsTracker.startBatch(blockLabels.length);
      let batchSuccess = false;
      let retryCount = 0;
      
      while (!batchSuccess && retryCount < currentConfig.maxRetries) {
        try {
          const blockZPL = blockLabels.join('');
          
          // Otimiza o ZPL para melhor qualidade antes de enviar
          const optimizedZPL = optimizeZplForQuality(blockZPL);

          // Usa 12dpmm (300 dpi) para melhor resolução
          const response = await fetch('https://api.labelary.com/v1/printers/12dpmm/labels/4x6/0/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: optimizedZPL,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          
          // Validate PDF blob
          if (blob.size === 0) {
            throw new Error('Empty PDF received');
          }
          
          pdfs.push(blob);
          batchSuccess = true;
          successfulBatches++;
          consecutiveErrors = 0;

          const progressValue = ((i + blockLabels.length) / labels.length) * 100;
          onProgress(progressValue);

          console.log(`✅ Batch ${batchNumber} completed successfully (${blob.size} bytes)`);
          
        } catch (error) {
          retryCount++;
          consecutiveErrors++;
          
          console.error(`❌ Batch ${batchNumber} attempt ${retryCount} failed:`, error);
          
          if (retryCount < currentConfig.maxRetries) {
            const retryDelay = currentConfig.delayBetweenBatches * retryCount;
            console.log(`⏳ Retrying in ${retryDelay}ms...`);
            await delay(retryDelay);
          } else {
            console.error(`💥 Batch ${batchNumber} failed after ${currentConfig.maxRetries} attempts`);
            toast({
              variant: "destructive",
              title: t('blockError'),
              description: t('blockErrorMessage', { block: batchNumber }),
              duration: 4000,
            });
          }
        }
      }
      
      metricsTracker.endBatch(batchStartTime, blockLabels.length, batchSuccess, batchSuccess ? 0 : 1);
      
      // Check if we should switch to fallback mode
      if (consecutiveErrors >= 2 || metricsTracker.shouldUseFallback()) {
        console.log(`⚠️ Switching to fallback mode due to high error rate`);
        currentConfig = {
          ...currentConfig,
          delayBetweenBatches: currentConfig.fallbackDelay,
          labelsPerBatch: Math.max(currentConfig.labelsPerBatch - 2, 10),
        };
        metricsTracker.updateConfig(currentConfig);
        consecutiveErrors = 0;
      }

      // Add delay between batches (except for the last batch)
      if (i + currentConfig.labelsPerBatch < labels.length) {
        console.log(`⏱️ Waiting ${currentConfig.delayBetweenBatches}ms before next batch...`);
        await delay(currentConfig.delayBetweenBatches);
      }
    }
    
    const totalTime = Date.now() - totalStartTime;
    const stats = metricsTracker.getProcessingStats();
    
    console.log(`🏆 Conversion completed in ${totalTime}ms`);
    console.log(`📊 Final conversion stats:`, {
      ...stats,
      totalTimeMs: totalTime,
      inputLabels: labels.length,
      successfulBatches: successfulBatches,
      outputPdfs: pdfs.length,
      averageTimePerLabel: labels.length > 0 ? totalTime / labels.length : 0,
      labelsPerSecond: labels.length > 0 ? (labels.length / (totalTime / 1000)).toFixed(2) : 0,
    });
    
    metricsTracker.logPerformanceReport();
    
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
