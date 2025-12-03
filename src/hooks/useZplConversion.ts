
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { usePdfOperations } from '@/hooks/conversion/usePdfOperations';
import { useConversionState } from '@/hooks/conversion/useConversionState';
import { useConversionMetrics } from '@/hooks/conversion/useConversionMetrics';
import { useImageUpscaler } from '@/hooks/conversion/useImageUpscaler';
import { convertImagesToPdf } from '@/utils/pdfUtils';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';

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

  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplBlocksToPngs, parseLabelsFromZpl } = useZplApiConversion();
  const { logPerformanceMetrics } = useConversionMetrics();
  const { upscaleImages } = useImageUpscaler();
  
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

  const convertToPDF = async (zplContent: string, useOptimizedTiming: boolean = true) => {
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
      
      // Phase 1: Convert ZPL to PNGs (0-50%)
      const conversionPhaseStart = Date.now();
      console.log(`🖼️ Phase 1: Converting ZPL to PNGs...`);

      const pngs = await convertZplBlocksToPngs(labels, (progressValue) => {
        setProgress(progressValue * 0.5); // 0-50% for PNG conversion
      }, config);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ PNG conversion completed in ${conversionPhaseTime}ms (${pngs.length} images)`);

      // Phase 2: Upscale PNGs with AI (50-80%)
      const upscaleStart = Date.now();
      console.log(`🔧 Phase 2: Upscaling ${pngs.length} images with AI...`);
      
      const upscaledPngs = await upscaleImages(pngs, (progressValue) => {
        setProgress(50 + (progressValue * 0.3)); // 50-80% for upscaling
      });
      
      const upscaleTime = Date.now() - upscaleStart;
      console.log(`✅ AI upscaling completed in ${upscaleTime}ms`);

      // Phase 3: Convert upscaled PNGs to PDF (80-90%)
      const pdfCreateStart = Date.now();
      console.log(`📄 Phase 3: Creating PDF from upscaled images...`);
      setProgress(85);
      
      const finalPdf = await convertImagesToPdf(upscaledPngs);
      
      const pdfCreateTime = Date.now() - pdfCreateStart;
      console.log(`✅ PDF created in ${pdfCreateTime}ms`);

      try {
        // Phase 4: Upload and finish (90-100%)
        setProgress(90);
        const { pdfPath, blobUrl, mergeTime, uploadTime } = await processPdfs([finalPdf], setProgress);
        
        // Calculate total processing time
        const totalTime = Date.now() - conversionStartTime;
        
        // Save to history using the EXACT same finalLabelCount from the beginning and include processing time
        if (pdfPath) {
          console.log(`💾 Saving to history: ${finalLabelCount} labels processed in ${totalTime}ms (CONSISTENT CORRECTED COUNT)`);
          await addToProcessingHistory(finalLabelCount, pdfPath, totalTime);
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, finalLabelCount, upscaleTime);

        toast({
          title: t('success'),
          description: `${t('successMessage')} com IA (${totalTime}ms, ${finalLabelCount} etiquetas)`,
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
