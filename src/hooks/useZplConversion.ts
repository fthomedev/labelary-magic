
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';

import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { usePdfOperations } from '@/hooks/conversion/usePdfOperations';
import { useConversionState } from '@/hooks/conversion/useConversionState';
import { useConversionMetrics } from '@/hooks/conversion/useConversionMetrics';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig, TURBO_CONFIG } from '@/config/processingConfig';

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
  pdfPath?: string;
}

export const useZplConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  
  const { convertZplBlocksToPdfs, parseLabelsFromZpl } = useZplApiConversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  
  const {
    isConverting,
    setIsConverting,
    progress,
    setProgress,
    isProcessingComplete,
    historyRefreshTrigger,
    resetProcessingStatus,
    startConversion,
    finishConversion,
    triggerHistoryRefresh
  } = useConversionState();

  const {
    pdfUrls,
    setPdfUrls,
    lastPdfUrl,
    lastPdfPath,
    processPdfs,
    downloadPdf
  } = usePdfOperations();

  const convertToPDF = async (zplContent: string, useOptimizedTiming: boolean = true, turboMode: boolean = false) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      setPdfUrls([]);

      // Parse labels ONCE at the beginning and use this count throughout
      const labels = parseLabelsFromZpl(zplContent);
      // Divide by 2 to get the correct final count as each label has 2 ^XA markers
      const finalLabelCount = Math.ceil(labels.length / 2);
      
      console.log(`🎯 Starting conversion of ${finalLabelCount} labels (FINAL COUNT CORRECTED - ${labels.length} blocks / 2)`);
      console.log(`⚡ Using ${turboMode ? 'turbo' : (useOptimizedTiming ? 'optimized' : 'default')} timing configuration`);
      
      // Choose configuration based on label count and user preference
      let config: ProcessingConfig;
      if (turboMode) {
        config = TURBO_CONFIG; // Most aggressive (still with safe fallbacks)
      } else if (!useOptimizedTiming) {
        config = { ...DEFAULT_CONFIG, delayBetweenBatches: 3000 }; // Original conservative timing
      } else if (finalLabelCount > 100) {
        config = DEFAULT_CONFIG; // Moderate optimization for large batches
      } else {
        config = FAST_CONFIG; // Aggressive optimization for smaller batches
      }
      
      console.log(`📋 Using configuration:`, config);
      
      const conversionPhaseStart = Date.now();

      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue * 0.8); // Reserve 20% for merging and upload
      }, config);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Label conversion phase completed in ${conversionPhaseTime}ms`);

        const { blobUrl, mergeTime, uploadTime } = await processPdfs(pdfs, setProgress);
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, finalLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} (${totalTime}ms, ${finalLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        // Set processing complete to show the completion UI
        finishConversion();
        console.error('Error uploading to storage:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorMessage'),
        duration: 5000,
      });
    } finally {
      setIsConverting(false);
      setProgress(100);
    }
  };

  return {
    isConverting,
    progress,
    pdfUrls,
    isProcessingComplete,
    lastPdfUrl,
    lastPdfPath,
    convertToPDF,
    historyRefreshTrigger,
    resetProcessingStatus,
  };
};
