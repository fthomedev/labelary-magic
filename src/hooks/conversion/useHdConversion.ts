import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useHdImageConversion } from './useHdImageConversion';
import { usePdfOperations } from './usePdfOperations';
import { useConversionState } from './useConversionState';
import { useConversionMetrics } from './useConversionMetrics';
import { organizeImagesInSeparatePDF } from '@/utils/pdfPageUtils';
import { useUploadPdf, PdfTooLargeError } from '@/hooks/pdf/useUploadPdf';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { DEFAULT_CONFIG, ProcessingConfig } from '@/config/processingConfig';
import { calculateProgress } from './useProgressCalculator';
import { parseZplWithCount, detectZplFormat } from '@/utils/zplUtils';
import { LabelSize, DEFAULT_LABEL_SIZE } from '@/types/labelSize';
import { reportProcessingError } from '@/lib/errorLogging';

export const useHdConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplToHdImages } = useHdImageConversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  const { uploadPDFToStorage } = useUploadPdf();
  const { ensurePdfBucketExists } = useStorageOperations();

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
    triggerHistoryRefresh,
  } = useConversionState();

  const {
    lastPdfUrl,
    setLastPdfUrl,
    lastPdfPath,
    setLastPdfPath,
    downloadPdf,
    resetPdfState,
  } = usePdfOperations();

  const convertToHdPDF = async (zplContent: string, labelSize: LabelSize = DEFAULT_LABEL_SIZE) => {
    if (!zplContent) return;

    console.log('\n✨ HD MODE (With Upscaling) - Quality Conversion');

    const conversionStartTime = Date.now();

    // Metadata-only context reused by every failure log in this run
    const logContext = {
      processingType: 'hd' as const,
      zplFormat: detectZplFormat(zplContent),
      labelSize: `${labelSize.widthCm}x${labelSize.heightCm}`,
      hasImages: /\^GF[AB]/.test(zplContent),
    };
    let labelsAttempted = 0;

    try {
      resetPdfState();
      startConversion();

      const { blocks: labelBlocks, labelCount: finalLabelCount } = parseZplWithCount(zplContent);

      console.log(`\n========== HD CONVERSION ==========`);
      console.log(`📊 Parsed blocks: ${labelBlocks.length} (final count: ${finalLabelCount})`);

      labelsAttempted = finalLabelCount;
      updateProgress({ totalLabels: finalLabelCount, stage: 'converting' });

      const config: ProcessingConfig = DEFAULT_CONFIG;
      const conversionPhaseStart = Date.now();

      const images = await convertZplToHdImages(labelBlocks, (progressValue, currentBlock) => {
        const displayCurrent = currentBlock ? Math.min(finalLabelCount, Math.ceil(currentBlock / 2)) : 0;
        updateProgress({ percentage: progressValue, currentLabel: displayCurrent, stage: 'converting' });
      }, config, labelSize);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ HD image conversion completed in ${conversionPhaseTime}ms`);
      console.log(`📊 PNG images generated: ${images.length}`);

      try {
        updateProgress({ percentage: calculateProgress('hd', 'organizing', 0), stage: 'organizing' });

        await ensurePdfBucketExists();

        updateProgress({ percentage: calculateProgress('hd', 'uploading', 0), stage: 'uploading' });

        const mergeStartTime = Date.now();
        const { pdfBlob: hdPdf, labelsAdded, failedLabels } = await organizeImagesInSeparatePDF(images, labelSize);
        const mergeTime = Date.now() - mergeStartTime;

        console.log(`📄 HD PDF organization completed in ${mergeTime}ms`);
        console.log(`📊 Labels in PDF: ${labelsAdded}`);

        if (labelsAdded !== images.length) {
          console.error(`🚨 LABEL MISMATCH: Expected ${images.length}, got ${labelsAdded}`);
          console.error(`🚨 Failed indices: [${failedLabels.join(', ')}]`);
          reportProcessingError({
            ...logContext,
            errorType: 'pdf_merge_failed',
            message: `Divergência de páginas no PDF HD: esperado ${images.length}, obtido ${labelsAdded}`,
            labelCountAttempted: finalLabelCount,
            failedCount: images.length - labelsAdded,
            processingTimeMs: Date.now() - conversionStartTime,
            metadata: { expectedPages: images.length, actualPages: labelsAdded, failedIndices: failedLabels.slice(0, 50) },
          });
        }

        updateProgress({ percentage: calculateProgress('hd', 'uploading', 50), stage: 'uploading' });

        const uploadStartTime = Date.now();
        const pdfPath = await uploadPDFToStorage(hdPdf);
        const uploadTime = Date.now() - uploadStartTime;

        console.log(`☁️ HD PDF upload completed in ${uploadTime}ms:`, pdfPath);
        setLastPdfPath(pdfPath);

        const blobUrl = window.URL.createObjectURL(hdPdf);
        setLastPdfUrl(blobUrl);

        const totalTime = Date.now() - conversionStartTime;
        const correctedLabelCount = finalLabelCount;

        if (pdfPath) {
          console.log(`💾 Saving HD conversion: ${correctedLabelCount} labels in ${totalTime}ms`);
          await addToProcessingHistory(correctedLabelCount, pdfPath, totalTime, 'hd');
          triggerHistoryRefresh();
        }

        updateProgress({ percentage: calculateProgress('hd', 'complete', 100), stage: 'complete' });

        console.log(`\n✅ HD CONVERSION COMPLETE`);
        console.log(`📊 Output pages: ${labelsAdded} (displayed labels: ${correctedLabelCount})`);
        console.log(`⏱️ Total time: ${totalTime}ms`);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, correctedLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} - HD (${totalTime}ms, ${correctedLabelCount} etiquetas)`,
          duration: 5000,
        });

        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading HD PDF:', uploadError);
        reportProcessingError({
          ...logContext,
          errorType: 'storage_upload_failed',
          error: uploadError,
          labelCountAttempted: labelsAttempted,
          processingTimeMs: Date.now() - conversionStartTime,
          metadata: { pages: images.length },
        });
        toast({
          variant: 'destructive',
          title: t('error'),
          description: uploadError instanceof PdfTooLargeError
            ? t('pdfTooLargeMessage')
            : t('errorMessage'),
          duration: uploadError instanceof PdfTooLargeError ? 12000 : 5000,
        });
      }
    } catch (error) {
      console.error('HD conversion error:', error);
      reportProcessingError({
        ...logContext,
        errorType: 'unknown_fatal',
        error,
        labelCountAttempted: labelsAttempted,
        processingTimeMs: Date.now() - conversionStartTime,
      });
      toast({
        variant: 'destructive',
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
    isProcessingComplete,
    lastPdfUrl,
    lastPdfPath,
    convertToHdPDF,
    historyRefreshTrigger,
    resetProcessingStatus,
    resetPdfState,
  };
};
