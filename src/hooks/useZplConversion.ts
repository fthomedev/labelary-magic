
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { mergePDFs } from '@/utils/pdfUtils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { DEFAULT_CONFIG, FAST_CONFIG, ProcessingConfig } from '@/config/processingConfig';

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
  pdfPath?: string;
}

export const useZplConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | undefined>(undefined);
  const [lastPdfPath, setLastPdfPath] = useState<string | undefined>(undefined);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const { toast } = useToast();
  const { t } = useTranslation();

  const { uploadPDFToStorage, getPdfPublicUrl } = useUploadPdf();
  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl, countLabelsInZpl } = useZplApiConversion();
  const { ensurePdfBucketExists } = useStorageOperations();

  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
  };

  const convertToPDF = async (zplContent: string, useOptimizedTiming: boolean = true) => {
    if (!zplContent) return;
    
    const conversionStartTime = Date.now();
    
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);

      // Parse labels once and use this count throughout the entire process
      const labels = parseLabelsFromZpl(zplContent);
      const finalLabelCount = labels.length;
      
      console.log(`🎯 Starting conversion of ${finalLabelCount} labels`);
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
      
      const newPdfUrls: string[] = [];
      const conversionPhaseStart = Date.now();

      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue * 0.8); // Reserve 20% for merging and upload
      }, config);

      const conversionPhaseTime = Date.now() - conversionPhaseStart;
      console.log(`⚡ Label conversion phase completed in ${conversionPhaseTime}ms`);

      // Create temporary blob URLs for the current session
      pdfs.forEach(blob => {
        const blockUrl = window.URL.createObjectURL(blob);
        newPdfUrls.push(blockUrl);
      });
      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          setProgress(85);
          const mergeStartTime = Date.now();
          
          console.log(`🔄 Starting PDF merge of ${pdfs.length} files...`);
          const mergedPdf = await mergePDFs(pdfs);
          
          const mergeTime = Date.now() - mergeStartTime;
          console.log(`✅ PDF merge completed in ${mergeTime}ms (${mergedPdf.size} bytes)`);
          
          setProgress(90);
          
          // Ensure bucket exists
          await ensurePdfBucketExists();
          
          setProgress(95);
          const uploadStartTime = Date.now();
          
          // Upload PDF to storage
          let pdfPath;
          try {
            pdfPath = await uploadPDFToStorage(mergedPdf);
            const uploadTime = Date.now() - uploadStartTime;
            console.log(`☁️ PDF upload completed in ${uploadTime}ms:`, pdfPath);
            setLastPdfPath(pdfPath);
            
            // Get the temporary blob URL for the current session
            const blobUrl = window.URL.createObjectURL(mergedPdf);
            setLastPdfUrl(blobUrl);
            
            // Save to history using the consistent final label count
            if (pdfPath) {
              console.log(`💾 Saving to history: ${finalLabelCount} labels processed`);
              await addToProcessingHistory(finalLabelCount, pdfPath);
              setHistoryRefreshTrigger(prev => prev + 1);
            }
            
            setProgress(100);
            
            // Download the file
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'etiquetas.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            const totalTime = Date.now() - conversionStartTime;
            console.log(`🏁 Total conversion process completed in ${totalTime}ms`);
            console.log(`📊 Performance breakdown:`, {
              totalTimeMs: totalTime,
              conversionTimeMs: conversionPhaseTime,
              mergeTimeMs: mergeTime,
              uploadTimeMs: uploadTime,
              labelsProcessed: finalLabelCount,
              averageTimePerLabel: finalLabelCount > 0 ? totalTime / finalLabelCount : 0,
              labelsPerSecond: finalLabelCount > 0 ? (finalLabelCount / (totalTime / 1000)).toFixed(2) : 0,
            });

            toast({
              title: t('success'),
              description: `${t('successMessage')} (${totalTime}ms, ${finalLabelCount} etiquetas)`,
              duration: 5000,
            });
            
            // Set processing complete to show the completion UI
            setIsProcessingComplete(true);
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
          console.error('Error merging PDFs:', error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mergePdfError'),
            duration: 5000,
          });
        }
      } else {
        throw new Error("No PDFs were generated successfully.");
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
