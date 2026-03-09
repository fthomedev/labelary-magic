import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useA4Conversion } from './useA4Conversion';
import { useA4DirectConversion, A4ConversionError } from './useA4DirectConversion';
import { usePdfOperations } from './usePdfOperations';
import { useConversionState } from './useConversionState';
import { useConversionMetrics } from './useConversionMetrics';
import { organizeImagesInA4PDF, organizeImagesInSeparatePDF } from '@/utils/a4Utils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { A4_CONFIG, ProcessingConfig } from '@/config/processingConfig';
import { calculateProgress } from './useProgressCalculator';
import { parseZplWithCount } from '@/utils/zplUtils';

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
    lastPdfUrl,
    setLastPdfUrl,
    lastPdfPath,
    setLastPdfPath,
    downloadPdf,
    resetPdfState
  } = usePdfOperations();

  // Fast A4 conversion using PNG pipeline without upscaling
  const convertToA4PDFDirect = async (zplContent: string) => {
    console.log('\n🚀 A4 FAST MODE (No Upscaling) - PNG Pipeline');
    
    const conversionStartTime = Date.now();
    
    try {
      // Clear previous PDF state before starting new conversion
      resetPdfState();
      startConversion();
      
      // Parse labels
      const labels = parseLabelsFromZpl(zplContent);
      
      console.log(`\n========== A4 FAST CONVERSION ==========`);
      console.log(`📊 Parsed labels: ${labels.length}`);
      
      updateProgress({ totalLabels: labels.length, stage: 'converting' });
      
      const config: ProcessingConfig = A4_CONFIG;

      // Convert to PNG images WITHOUT upscaling
      const images = await convertZplToA4Images(labels, (progressValue, currentLabel) => {
        updateProgress({ percentage: progressValue, currentLabel, stage: 'converting' });
      }, config, false); // enhanceLabels = false (skip upscaling)

      console.log(`📊 PNG images generated: ${images.length}`);

      try {
        updateProgress({ percentage: calculateProgress('standard', 'organizing', 0), stage: 'organizing' });
        
        // Ensure bucket exists
        await ensurePdfBucketExists();
        
        updateProgress({ percentage: calculateProgress('standard', 'uploading', 0), stage: 'uploading' });
        
        // Organize images into A4 PDF (same method as enhanced path)
        const mergeStartTime = Date.now();
        const { pdfBlob: a4Pdf, labelsAdded, failedLabels } = await organizeImagesInA4PDF(images);
        const mergeTime = Date.now() - mergeStartTime;
        
        console.log(`📄 A4 PDF organization completed in ${mergeTime}ms`);
        console.log(`📊 Labels in PDF: ${labelsAdded}`);
        
        if (labelsAdded !== images.length) {
          console.error(`🚨 LABEL MISMATCH: Expected ${images.length}, got ${labelsAdded}`);
          console.error(`🚨 Failed indices: [${failedLabels.join(', ')}]`);
        }
        
        updateProgress({ percentage: calculateProgress('standard', 'uploading', 50), stage: 'uploading' });
        
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
          console.log(`💾 Saving fast conversion: ${actualLabelCount} labels in ${totalTime}ms`);
          await addToProcessingHistory(actualLabelCount, pdfPath, totalTime, 'a4');
          triggerHistoryRefresh();
        }
        
        updateProgress({ percentage: calculateProgress('standard', 'complete', 100), stage: 'complete' });

        console.log(`\n✅ A4 FAST CONVERSION COMPLETE`);
        console.log(`📊 Input: ${labels.length} → Output: ${labelsAdded} labels`);
        console.log(`⏱️ Total time: ${totalTime}ms`);

        toast({
          title: t('success'),
          description: `${t('successMessage')} - A4 Rápido (${totalTime}ms, ${actualLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading A4 PDF:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('A4 fast conversion error:', error);
      
      // Extract specific error message
      let errorDescription = t('errorMessage');
      if (error instanceof A4ConversionError) {
        errorDescription = error.userMessage;
        console.error('Technical details:', error.technicalDetails);
      } else if (error instanceof Error) {
        errorDescription = error.message;
      }
      
      toast({
        variant: "destructive",
        title: t('error'),
        description: errorDescription,
        duration: 8000,
      });
    } finally {
      setIsConverting(false);
      setProgress(100);
    }
  };

  // HD conversion with AI upscaling - one label per page
  const convertToHdPDF = async (zplContent: string) => {
    console.log('\n✨ HD MODE (With Upscaling) - Quality Conversion');
    
    const conversionStartTime = Date.now();
    
    try {
      // Clear previous PDF state before starting new conversion
      resetPdfState();
      startConversion();
      
      // Parse labels using centralized utility (keeps counting identical to Standard)
      const { blocks: labelBlocks, labelCount: finalLabelCount } = parseZplWithCount(zplContent);
      
      console.log(`\n========== HD CONVERSION ==========`);
      console.log(`📊 Parsed blocks: ${labelBlocks.length} (final count: ${finalLabelCount})`);
      
      updateProgress({ totalLabels: finalLabelCount, stage: 'converting' });
      
      const config: ProcessingConfig = A4_CONFIG;
      const conversionPhaseStart = Date.now();

      // Convert to PNG images at high DPI (24dpmm = 600 DPI)
      const images = await convertZplToA4Images(labelBlocks, (progressValue, currentBlock) => {
        // Keep the displayed counter identical to Standard by mapping blocks -> labels
        const displayCurrent = currentBlock ? Math.min(finalLabelCount, Math.ceil(currentBlock / 2)) : 0;
        updateProgress({ percentage: progressValue, currentLabel: displayCurrent, stage: 'converting' });
      }, config, true); // enhanceLabels = true (uses 24dpmm)

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ HD image conversion (600 DPI) completed in ${conversionPhaseTime}ms`);
      console.log(`📊 PNG images generated: ${images.length}`);

      try {
        updateProgress({ percentage: calculateProgress('hd', 'organizing', 0), stage: 'organizing' });
        
        // Ensure bucket exists
        await ensurePdfBucketExists();
        
        updateProgress({ percentage: calculateProgress('hd', 'uploading', 0), stage: 'uploading' });
        
        // Organize images into PDF with one label per page
        const mergeStartTime = Date.now();
        const { pdfBlob: hdPdf, labelsAdded, failedLabels } = await organizeImagesInSeparatePDF(images);
        const mergeTime = Date.now() - mergeStartTime;
        
        console.log(`📄 HD PDF organization completed in ${mergeTime}ms`);
        console.log(`📊 Labels in PDF: ${labelsAdded}`);
        
        if (labelsAdded !== images.length) {
          console.error(`🚨 LABEL MISMATCH: Expected ${images.length}, got ${labelsAdded}`);
          console.error(`🚨 Failed indices: [${failedLabels.join(', ')}]`);
        }
        
        updateProgress({ percentage: calculateProgress('hd', 'uploading', 50), stage: 'uploading' });
        
        // Upload PDF to storage
        const uploadStartTime = Date.now();
        const pdfPath = await uploadPDFToStorage(hdPdf);
        const uploadTime = Date.now() - uploadStartTime;
        
        console.log(`☁️ HD PDF upload completed in ${uploadTime}ms:`, pdfPath);
        setLastPdfPath(pdfPath);
        
        // Create blob URL for download
        const blobUrl = window.URL.createObjectURL(hdPdf);
        setLastPdfUrl(blobUrl);
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        const correctedLabelCount = finalLabelCount;
        
        // Save to history
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
        toast({
          variant: "destructive",
          title: t('error'),
          description: t('errorMessage'),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('HD conversion error:', error);
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

  // Main entry point - routes to direct or HD conversion
  const convertToA4PDF = async (zplContent: string, enhanceLabels: boolean = false) => {
    console.log(`\n🔧 convertToA4PDF called - enhanceLabels: ${enhanceLabels}`);
    
    if (!zplContent) return;
    
    if (enhanceLabels === true) {
      // Use PNG → Upscale → PDF pipeline (slower, higher quality, one label per page)
      await convertToHdPDF(zplContent);
    } else {
      // Use direct Labelary A4 API (fast, no upscaling)
      await convertToA4PDFDirect(zplContent);
    }
  };

  return {
    isConverting,
    progress,
    progressInfo,
    isProcessingComplete,
    lastPdfUrl,
    lastPdfPath,
    convertToA4PDF,
    historyRefreshTrigger,
    resetProcessingStatus,
    resetPdfState,
  };
};
