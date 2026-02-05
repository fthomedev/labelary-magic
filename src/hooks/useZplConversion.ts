import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useErrorRecords } from '@/hooks/history/useErrorRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { usePdfOperations } from '@/hooks/conversion/usePdfOperations';
import { useConversionState } from '@/hooks/conversion/useConversionState';
import { useConversionMetrics } from '@/hooks/conversion/useConversionMetrics';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';
import { calculateProgress } from '@/hooks/conversion/useProgressCalculator';
import { parseZplWithCount } from '@/utils/zplUtils';
export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
  pdfPath?: string;
  processingTime?: number;
  processingType?: 'standard' | 'a4' | 'hd';
}

export const useZplConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { addToProcessingHistory } = useHistoryRecords();
  const { logFatalError } = useErrorRecords();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl } = useZplApiConversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  
  const {
    isConverting,
    setIsConverting,
    progress,
    setProgress,
    progressInfo,
    updateProgress,
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
    downloadPdf,
    resetPdfState
  } = usePdfOperations();

  const convertToPDF = async (zplContent: string, useOptimizedTiming: boolean = true) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    let labelCountAttempted: number | undefined;
    
    try {
      // Clear previous PDF state before starting new conversion
      resetPdfState();
      startConversion();

      // Parse labels ONCE at the beginning using centralized utility
      const { blocks: labels, labelCount: finalLabelCount } = parseZplWithCount(zplContent);
      labelCountAttempted = finalLabelCount;
      
      updateProgress({ totalLabels: finalLabelCount, stage: 'converting' });
      
      console.log(`🎯 Starting conversion of ${finalLabelCount} labels (${labels.length} blocks / 2)`);
      console.log(`⚡ Using ${useOptimizedTiming ? 'optimized' : 'default'} timing configuration`);
      
      // Choose configuration based on label count and user preference
      let config: ProcessingConfig;
      if (!useOptimizedTiming) {
        config = { ...DEFAULT_CONFIG, delayBetweenBatches: 3000 }; // Original conservative timing
      } else if (finalLabelCount > 100) {
        config = DEFAULT_CONFIG; // Moderate optimization for large batches
      } else {
        config = FAST_CONFIG; // Aggressive optimization for smaller batches
      }
      
      console.log(`📋 Using configuration:`, config);
      
      const conversionPhaseStart = Date.now();

      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        // progressValue is 0-100 within the converting stage
        const percentage = calculateProgress('standard', 'converting', progressValue);
        const currentLabel = Math.floor((progressValue / 100) * finalLabelCount);
        updateProgress({ percentage, currentLabel, stage: 'converting' });
      }, config);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Label conversion phase completed in ${conversionPhaseTime}ms`);

      try {
        updateProgress({ percentage: calculateProgress('standard', 'organizing', 0), stage: 'organizing' });
        const { pdfPath, blobUrl, mergeTime, uploadTime } = await processPdfs(pdfs, (p) => {
          // p is 0-100 within the uploading stage
          const percentage = calculateProgress('standard', 'uploading', p);
          updateProgress({ percentage, stage: 'uploading' });
        });
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        // Save to history using the EXACT same finalLabelCount from the beginning and include processing time
        if (pdfPath) {
          console.log(`💾 Saving to history: ${finalLabelCount} labels processed in ${totalTime}ms (CONSISTENT CORRECTED COUNT)`);
          await addToProcessingHistory(finalLabelCount, pdfPath, totalTime, 'standard');
          triggerHistoryRefresh();
        }
        
        updateProgress({ percentage: calculateProgress('standard', 'complete', 100), stage: 'complete' });

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, finalLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} (${totalTime}ms, ${finalLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        // Set processing complete to show the completion UI
        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      const processingTime = Date.now() - conversionStartTime;
      
      // Log fatal error to database
      await logFatalError({
        errorType: 'conversion_error',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        processingType: 'standard',
        labelCountAttempted,
        processingTimeMs: processingTime,
        metadata: { useOptimizedTiming }
      });
      
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
    progressInfo,
    pdfUrls,
    isProcessingComplete,
    lastPdfUrl,
    lastPdfPath,
    convertToPDF,
    historyRefreshTrigger,
    resetProcessingStatus,
    resetPdfState,
  };
};
