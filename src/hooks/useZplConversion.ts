
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
  const { upscaleImages, initUpscaler } = useImageUpscaler();
  
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
      const inputLabelCount = labels.length;
      
      console.log(`🎯 INPUT: ${inputLabelCount} labels parsed from ZPL content`);
      console.log(`⚡ Using ${useOptimizedTiming ? 'optimized' : 'default'} timing configuration`);
      
      // Choose configuration based on label count and user preference
      let config: ProcessingConfig;
      if (!useOptimizedTiming) {
        config = { ...DEFAULT_CONFIG, delayBetweenBatches: 3000 }; // Original conservative timing
      } else if (inputLabelCount > 100) {
        config = DEFAULT_CONFIG; // Moderate optimization for large batches
      } else {
        config = FAST_CONFIG; // Aggressive optimization for smaller batches
      }
      
      console.log(`📋 Using configuration:`, config);
      
      // Phase 1: Convert ZPL to PNGs (0-50%) + Pre-initialize upscaler in parallel
      const conversionPhaseStart = Date.now();
      console.log(`🖼️ Phase 1: Converting ZPL to PNGs + pre-warming AI upscaler...`);

      // Start upscaler initialization in parallel with PNG conversion
      const upscalerPromise = initUpscaler();

      const pngs = await convertZplBlocksToPngs(labels, (progressValue) => {
        setProgress(progressValue * 0.5); // 0-50% for PNG conversion
      }, config);

      // Ensure upscaler is ready
      await upscalerPromise;

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      const outputPngCount = pngs.length;
      console.log(`⚡ PNG conversion completed in ${conversionPhaseTime}ms`);
      console.log(`📊 VALIDATION: Input=${inputLabelCount} labels → Output=${outputPngCount} PNGs`);
      
      if (outputPngCount !== inputLabelCount) {
        console.warn(`⚠️ LABEL LOSS DETECTED: ${inputLabelCount - outputPngCount} labels lost during conversion`);
      }

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
        
        // Save to history using the ACTUAL output count (PNGs converted to PDF)
        const actualOutputCount = upscaledPngs.length;
        if (pdfPath) {
          console.log(`💾 Saving to history: ${actualOutputCount} labels (input: ${inputLabelCount}, output: ${actualOutputCount})`);
          await addToProcessingHistory(actualOutputCount, pdfPath, totalTime);
          triggerHistoryRefresh();
        }
        
        setProgress(100);
        
        // Download the file
        downloadPdf(blobUrl);

        logPerformanceMetrics(totalTime, conversionPhaseTime, mergeTime, uploadTime, actualOutputCount, upscaleTime);

        toast({
          title: t('success'),
          description: `${t('successMessage')} (${actualOutputCount} etiquetas em ${(totalTime/1000).toFixed(1)}s)`,
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
