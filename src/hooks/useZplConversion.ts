import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { usePdfOperations } from '@/hooks/conversion/usePdfOperations';
import { useConversionState } from '@/hooks/conversion/useConversionState';
import { useConversionMetrics } from '@/hooks/conversion/useConversionMetrics';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';
import { calculateProgress } from '@/hooks/conversion/useProgressCalculator';
import { parseZplWithCount, detectZplFormat } from '@/utils/zplUtils';
import { LabelSize, DEFAULT_LABEL_SIZE } from '@/types/labelSize';
import { pairUpPdfs } from '@/utils/pdfTwoColumn';
import { reportProcessingError } from '@/lib/errorLogging';
import { PdfTooLargeError } from '@/hooks/pdf/useUploadPdf';


export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
  pdfPath?: string;
  processingTime?: number;
  processingType?: 'standard' | 'hd';
}

export const useZplConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { addToProcessingHistory } = useHistoryRecords();
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

  const convertToPDF = async (zplContent: string, useOptimizedTiming: boolean = true, labelSize: LabelSize = DEFAULT_LABEL_SIZE, twoColumn: boolean = false) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();

    // Metadata-only context reused by every failure log in this run
    const zplFormat = detectZplFormat(zplContent);
    const hasImages = /\^GF[AB]/.test(zplContent);
    const logContext = {
      processingType: 'standard' as const,
      zplFormat,
      labelSize: `${labelSize.widthCm}x${labelSize.heightCm}`,
      twoColumn,
      hasImages,
    };
    let fatalLogged = false;
    
    try {
      // Clear previous PDF state before starting new conversion
      resetPdfState();
      startConversion();

      // Parse labels ONCE at the beginning using centralized utility
      const { blocks: labels, labelCount: finalLabelCount } = parseZplWithCount(zplContent);
      
      updateProgress({ totalLabels: finalLabelCount, stage: 'converting' });
      
      console.log(`🎯 Starting conversion of ${finalLabelCount} labels (${labels.length} blocks / 2)`);
      console.log(`⚡ Using ${useOptimizedTiming ? 'optimized' : 'default'} timing configuration`);

      if (labels.length === 0) {
        reportProcessingError({
          ...logContext,
          errorType: 'zpl_parse_empty',
          message: 'Arquivo aceito no upload mas nenhum bloco ^XA...^XZ válido após o parse',
          labelCountAttempted: 0,
          metadata: { contentLength: zplContent.length },
        });
        toast({
          variant: 'destructive',
          title: t('error'),
          description: t('emptyZplMessage'),
          duration: 7000,
        });
        setIsConverting(false);
        setProgress(0);
        return;
      }
      
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

      const { pdfs, missingLabels } = await convertZplBlocksToPdfs(labels, (progressValue) => {
        // progressValue is 0-100 within the converting stage
        const percentage = calculateProgress('standard', 'converting', progressValue);
        const currentLabel = Math.floor((progressValue / 100) * finalLabelCount);
        updateProgress({ percentage, currentLabel, stage: 'converting' });
      }, config, labelSize, { zplFormat, twoColumn, processingType: 'standard' });

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Label conversion phase completed in ${conversionPhaseTime}ms`);

      // Labels actually present in the generated PDF (blocks → logical labels)
      const labelsDelivered = labels.length > 0
        ? Math.max(0, Math.round(finalLabelCount * ((labels.length - missingLabels) / labels.length)))
        : 0;
      const isPartial = missingLabels > 0;

      // 2-column post-processing: pair 40×25mm labels into 85×25mm pages.
      let finalPdfs = pdfs;
      if (twoColumn && pdfs.length > 0) {
        console.log(`📐 2-column mode: pairing ${pdfs.length} PDF batches into 85×25mm pages...`);
        const pairStart = Date.now();
        try {
          const paired = await pairUpPdfs(pdfs);
          finalPdfs = [paired];
          console.log(`✅ 2-column pairing done in ${Date.now() - pairStart}ms (${paired.size} bytes)`);
        } catch (pairError) {
          reportProcessingError({
            ...logContext,
            errorType: 'two_column_pairing_failed',
            error: pairError,
            labelCountAttempted: finalLabelCount,
            processingTimeMs: Date.now() - pairStart,
            metadata: { pdfParts: pdfs.length },
          });
          fatalLogged = true;
          throw pairError;
        }
      }


      try {
        updateProgress({ percentage: calculateProgress('standard', 'organizing', 0), stage: 'organizing' });
        const { pdfPath, blobUrl, mergeTime, uploadTime } = await processPdfs(finalPdfs, (p) => {
          // p is 0-100 within the uploading stage
          const percentage = calculateProgress('standard', 'uploading', p);
          updateProgress({ percentage, stage: 'uploading' });
        }, { ...logContext, labelCountAttempted: finalLabelCount });
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        // Save to history with the REAL number of labels present in the PDF
        if (pdfPath) {
          console.log(`💾 Saving to history: ${labelsDelivered}/${finalLabelCount} labels in ${totalTime}ms`);
          await addToProcessingHistory(labelsDelivered, pdfPath, totalTime, 'standard');
          triggerHistoryRefresh();
        }
        
        updateProgress({ percentage: calculateProgress('standard', 'complete', 100), stage: 'complete' });

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, labelsDelivered);

        if (isPartial) {
          toast({
            variant: 'destructive',
            title: t('partialConversionTitle'),
            description: t('partialConversionMessage', {
              delivered: labelsDelivered,
              total: finalLabelCount,
            }),
            duration: 15000,
          });
        } else {
          toast({
            title: t('success'),
            description: `${t('successMessage')} (${totalTime}ms, ${finalLabelCount} etiquetas)`,
            duration: 5000,
          });
        }
        
        // Set processing complete to show the completion UI
        finishConversion();
      } catch (uploadError) {
        // processPdfs already logged the precise cause (merge / storage)
        console.error('Error uploading to storage:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: uploadError instanceof PdfTooLargeError
            ? t('pdfTooLargeMessage')
            : t('errorMessage'),
          duration: uploadError instanceof PdfTooLargeError ? 12000 : 5000,
        });

      }
    } catch (error) {
      console.error('Conversion error:', error);
      if (!fatalLogged) reportProcessingError({
        ...logContext,
        errorType: 'unknown_fatal',
        error,
        processingTimeMs: Date.now() - conversionStartTime,
      });
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
