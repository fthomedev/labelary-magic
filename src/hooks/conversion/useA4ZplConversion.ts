
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
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';

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

  const convertToA4PDF = async (zplContent: string, enhanceLabels: boolean = false) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      
      // Parse labels
      const labels = parseLabelsFromZpl(zplContent);
      
      console.log(`\n========== A4 CONVERSION TRACKING ==========`);
      console.log(`📊 CHECKPOINT 1 - Parsed labels: ${labels.length}`);
      console.log(`✨ Enhance labels (upscaling): ${enhanceLabels ? 'ENABLED' : 'DISABLED'}`);
      
      // Sempre usar A4_CONFIG (Cenário 2) para processamento A4
      const config: ProcessingConfig = A4_CONFIG;
      
      console.log(`📋 A4 using Cenário 2 configuration:`, config);
      
      const conversionPhaseStart = Date.now();

      // Convert to PNG images with batch processing
      const images = await convertZplToA4Images(labels, (progressValue) => {
        setProgress(progressValue); // 0-80%
      }, config, enhanceLabels);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ A4 image conversion phase completed in ${conversionPhaseTime}ms`);
      console.log(`📊 CHECKPOINT 2 - PNG images generated: ${images.length}`);

      try {
        setProgress(85);
        
        // Ensure bucket exists
        await ensurePdfBucketExists();
        
        setProgress(90);
        
        // Organize images into A4 PDF
        const mergeStartTime = Date.now();
        const { pdfBlob: a4Pdf, labelsAdded, failedLabels } = await organizeImagesInA4PDF(images);
        const mergeTime = Date.now() - mergeStartTime;
        
        console.log(`📄 A4 PDF organization completed in ${mergeTime}ms`);
        console.log(`📊 CHECKPOINT 3 - Labels in PDF: ${labelsAdded}`);
        
        // CRITICAL: Validate label count consistency
        if (labelsAdded !== images.length) {
          console.error(`🚨 LABEL MISMATCH: Expected ${images.length}, got ${labelsAdded} in PDF`);
          console.error(`🚨 Failed label indices: [${failedLabels.join(', ')}]`);
        }
        
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
        
        // Use actual labels added to PDF, not estimated count
        const actualLabelCount = labelsAdded;
        
        // Save to history with ACTUAL label count
        if (pdfPath) {
          console.log(`💾 Saving A4 conversion to history: ${actualLabelCount} labels processed in ${totalTime}ms`);
          await addToProcessingHistory(actualLabelCount, pdfPath, totalTime);
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl, 'etiquetas-a4.pdf');

        console.log(`\n========== FINAL CONVERSION SUMMARY ==========`);
        console.log(`📊 Input (parsed labels): ${labels.length}`);
        console.log(`📊 After validation/filtering: ${images.length} PNG images`);
        console.log(`📊 Final PDF labels: ${labelsAdded}`);
        if (labels.length !== labelsAdded) {
          const validFiltered = labels.length - images.length;
          const pdfLoss = images.length - labelsAdded;
          console.error(`🚨 TOTAL LOSS: ${labels.length - labelsAdded} labels`);
          console.error(`   - Filtered as invalid: ${validFiltered}`);
          console.error(`   - Lost in PNG conversion: ${labels.length - validFiltered - images.length}`);
          console.error(`   - Lost in PDF generation: ${pdfLoss}`);
        } else {
          console.log(`✅ All labels preserved!`);
        }
        console.log(`================================================\n`);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, actualLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} - A4 Format (${totalTime}ms, ${actualLabelCount} etiquetas)`,
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
