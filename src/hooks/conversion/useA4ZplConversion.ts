
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { usePdfOperations } from '@/hooks/conversion/usePdfOperations';
import { useConversionState } from '@/hooks/conversion/useConversionState';
import { useConversionMetrics } from '@/hooks/conversion/useConversionMetrics';
import { useA4Conversion } from '@/hooks/conversion/useA4Conversion';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export const useA4ZplConversion = () => {
  const { toast } = useToast();
  const { t } = useTranslation();

  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl } = useZplApiConversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  const { organizeInA4PDF } = useA4Conversion();
  
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
    uploadPdfToStorage,
    downloadPdf
  } = usePdfOperations();

  const convertToA4PDF = async (zplContent: string, useOptimizedTiming: boolean = true) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    
    try {
      startConversion();
      setPdfUrls([]);

      // Parse labels ONCE at the beginning and use this count throughout
      const labels = parseLabelsFromZpl(zplContent);
      // Divide by 2 to get the correct final count as each label has 2 ^XA markers
      const finalLabelCount = Math.ceil(labels.length / 2);
      
      console.log(`🎯 Starting A4 conversion of ${finalLabelCount} labels (FINAL COUNT CORRECTED - ${labels.length} blocks / 2)`);
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
      
      console.log(`📋 Using configuration for A4:`, config);
      
      const conversionPhaseStart = Date.now();

      // Convert to individual images first (same as standard)
      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue * 0.6); // Reserve 40% for A4 organization and upload
      }, config);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Label conversion phase completed in ${conversionPhaseTime}ms for A4`);

      try {
        setProgress(60);
        
        // Organize in A4 format instead of merging
        const a4OrganizationStart = Date.now();
        const a4PdfBlob = await organizeInA4PDF(pdfs);
        const a4OrganizationTime = Date.now() - a4OrganizationStart;
        
        setProgress(80);
        
        // Upload A4 PDF to storage
        const uploadStart = Date.now();
        const { pdfPath, blobUrl } = await uploadPdfToStorage(a4PdfBlob, 'a4');
        const uploadTime = Date.now() - uploadStart;
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        // Save to history using the EXACT same finalLabelCount from the beginning and include processing time and type
        if (pdfPath) {
          console.log(`💾 Saving to history: ${finalLabelCount} labels processed in ${totalTime}ms (CONSISTENT CORRECTED COUNT) - Type: a4`);
          await addToProcessingHistory(finalLabelCount, pdfPath, totalTime, 'a4');
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl);

        logPerformanceMetrics(totalTime, conversionPhaseTime, a4OrganizationTime, uploadTime, finalLabelCount);

        toast({
          title: t('success'),
          description: `PDF A4 criado com sucesso! (${totalTime}ms, ${finalLabelCount} etiquetas)`,
          duration: 5000,
        });
        
        // Set processing complete to show the completion UI
        finishConversion();
      } catch (uploadError) {
        console.error('Error uploading A4 PDF to storage:', uploadError);
        toast({
          variant: "destructive",
          title: t('error'),
          description: 'Erro ao fazer upload do PDF A4',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('A4 Conversion error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: 'Erro na conversão A4',
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
    convertToA4PDF,
    historyRefreshTrigger,
    resetProcessingStatus,
  };
};
