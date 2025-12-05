
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useA4Conversion } from './useA4Conversion';
import { useA4DirectConversion } from './useA4DirectConversion';
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
  const { convertZplToA4PDFDirect } = useA4DirectConversion();
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

  // Fast A4 conversion using direct Labelary API (no upscaling)
  const convertToA4PDFDirect = async (zplContent: string) => {
    console.log('\n🚀 A4 DIRECT MODE (No Upscaling) - Fast Conversion');
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      
      // Ensure bucket exists
      await ensurePdfBucketExists();
      
      // Direct conversion via Labelary API with A4 headers
      const { pdfBlob, labelCount } = await convertZplToA4PDFDirect(zplContent, (progressValue) => {
        setProgress(progressValue);
      });
      
      // Upload PDF to storage
      const uploadStartTime = Date.now();
      const pdfPath = await uploadPDFToStorage(pdfBlob);
      const uploadTime = Date.now() - uploadStartTime;
      
      console.log(`☁️ A4 PDF upload completed in ${uploadTime}ms:`, pdfPath);
      setLastPdfPath(pdfPath);
      
      // Create blob URL for download
      const blobUrl = window.URL.createObjectURL(pdfBlob);
      setLastPdfUrl(blobUrl);
      
      // Calculate total processing time
      const totalTime = Date.now() - conversionStartTime;
      
      // Save to history
      if (pdfPath) {
        console.log(`💾 Saving A4 direct conversion to history: ${labelCount} labels in ${totalTime}ms`);
        await addToProcessingHistory(labelCount, pdfPath, totalTime);
        triggerHistoryRefresh();
      }
      
      setProgress(100);
      
      // Download the file
      downloadPdf(blobUrl, 'etiquetas-a4.pdf');
      
      console.log(`\n✅ A4 DIRECT CONVERSION COMPLETE: ${labelCount} labels in ${totalTime}ms`);
      
      toast({
        title: t('success'),
        description: `${t('successMessage')} - A4 Format (${totalTime}ms, ${labelCount} etiquetas)`,
        duration: 5000,
      });
      
      finishConversion();
    } catch (error) {
      console.error('A4 direct conversion error:', error);
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

  // Full A4 conversion with AI upscaling (slower, higher quality)
  const convertToA4PDFWithUpscaling = async (zplContent: string) => {
    console.log('\n✨ A4 ENHANCED MODE (With Upscaling) - Quality Conversion');
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      
      // Parse labels
      const labels = parseLabelsFromZpl(zplContent);
      
      console.log(`\n========== A4 ENHANCED CONVERSION ==========`);
      console.log(`📊 Parsed labels: ${labels.length}`);
      
      const config: ProcessingConfig = A4_CONFIG;
      const conversionPhaseStart = Date.now();

      // Convert to PNG images with upscaling enabled
      const images = await convertZplToA4Images(labels, (progressValue) => {
        setProgress(progressValue); // 0-80%
      }, config, true); // enhanceLabels = true

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Image conversion + upscaling completed in ${conversionPhaseTime}ms`);
      console.log(`📊 PNG images generated: ${images.length}`);

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
        console.log(`📊 Labels in PDF: ${labelsAdded}`);
        
        if (labelsAdded !== images.length) {
          console.error(`🚨 LABEL MISMATCH: Expected ${images.length}, got ${labelsAdded}`);
          console.error(`🚨 Failed indices: [${failedLabels.join(', ')}]`);
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
        const actualLabelCount = labelsAdded;
        
        // Save to history
        if (pdfPath) {
          console.log(`💾 Saving enhanced conversion: ${actualLabelCount} labels in ${totalTime}ms`);
          await addToProcessingHistory(actualLabelCount, pdfPath, totalTime);
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl, 'etiquetas-a4.pdf');

        console.log(`\n✅ A4 ENHANCED CONVERSION COMPLETE`);
        console.log(`📊 Input: ${labels.length} → Output: ${labelsAdded} labels`);
        console.log(`⏱️ Total time: ${totalTime}ms`);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, actualLabelCount);

        toast({
          title: t('success'),
          description: `${t('successMessage')} - A4 Enhanced (${totalTime}ms, ${actualLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading enhanced A4 PDF:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('A4 enhanced conversion error:', error);
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

  // Main entry point - routes to direct or enhanced conversion
  const convertToA4PDF = async (zplContent: string, enhanceLabels: boolean = false) => {
    console.log(`\n🔧 convertToA4PDF called - enhanceLabels: ${enhanceLabels}`);
    
    if (!zplContent) return;
    
    if (enhanceLabels === true) {
      // Use PNG → Upscale → PDF pipeline (slower, higher quality)
      await convertToA4PDFWithUpscaling(zplContent);
    } else {
      // Use direct Labelary A4 API (fast, no upscaling)
      await convertToA4PDFDirect(zplContent);
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
