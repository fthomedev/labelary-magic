
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useA4Conversion } from './useA4Conversion';
import { usePdfOperations } from './usePdfOperations';
import { useConversionState } from './useConversionState';
import { useConversionMetrics } from './useConversionMetrics';
import { organizeImagesInA4PDF } from '@/utils/a4Utils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { DEFAULT_CONFIG } from '@/config/processingConfig';

export const useA4ZplConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplToA4Images, parseLabelsFromZpl } = useA4Conversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  const { uploadPDFToStorage } = useUploadPdf();
  const { ensurePdfBucketExists } = useStorageOperations();
  
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
    lastPdfUrl,
    setLastPdfUrl,
    lastPdfPath,
    setLastPdfPath,
    downloadPdf
  } = usePdfOperations();

  const convertToA4PDF = async (zplContent: string) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      
      // Parse labels
      const labels = parseLabelsFromZpl(zplContent);
      const finalLabelCount = Math.ceil(labels.length / 2);
      
      console.log(`🎯 Starting A4 conversion of ${finalLabelCount} labels`);
      
      const conversionPhaseStart = Date.now();

      // Convert to PNG images
      const images = await convertZplToA4Images(labels, (progressValue) => {
        setProgress(progressValue); // 0-80%
      }, DEFAULT_CONFIG);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ A4 image conversion phase completed in ${conversionPhaseTime}ms`);

      try {
        setProgress(85);
        
        // Ensure bucket exists
        await ensurePdfBucketExists();
        
        setProgress(90);
        
        // Organize images into A4 PDF
        const mergeStartTime = Date.now();
        const a4Pdf = await organizeImagesInA4PDF(images);
        const mergeTime = Date.now() - mergeStartTime;
        
        console.log(`📄 A4 PDF organization completed in ${mergeTime}ms`);
        
        setProgress(95);
        
        // Upload PDF to storage
        const uploadStartTime = Date.now();
        const pdfPath = await uploadPDFToStorage(a4Pdf);
        const uploadTime = Date.now() - uploadStartTime;
        
        console.log(`☁️ A4 PDF upload completed in ${uploadTime}ms:`, pdfPath);
        setLastPdfPath(pdfPath);
        
        // Create blob URL for download
        const blobUrl = window.URL.createObjectURL(a4Pdf);
        setLastPdfUrl(blobUrl);
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        // Save to history
        if (pdfPath) {
          console.log(`💾 Saving A4 conversion to history: ${finalLabelCount} labels processed in ${totalTime}ms`);
          await addToProcessingHistory(finalLabelCount, pdfPath, totalTime);
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl, 'etiquetas-a4.pdf');

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, finalLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} - A4 Format (${totalTime}ms, ${finalLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading A4 PDF to storage:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('A4 conversion error:', error);
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
    isProcessingComplete,
    lastPdfUrl,
    lastPdfPath,
    convertToA4PDF,
    historyRefreshTrigger,
    resetProcessingStatus,
  };
};
