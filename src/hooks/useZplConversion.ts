import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useZplApiConversion } from './conversion/useZplApiConversion';
import { usePdfMerge } from './pdf/usePdfMerge';
import { useSupabase } from './useSupabase';
import { useHistoryRecords } from './history/useHistoryRecords';

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
  pdfPath: string;
}

export const useZplConversion = () => {
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState<boolean>(false);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | null>(null);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl } = useZplApiConversion();
  const { mergePDFs } = usePdfMerge();
  const { uploadPdf } = useSupabase();
  const { addToProcessingHistory } = useHistoryRecords();

  const resetProcessingStatus = () => {
    setIsConverting(false);
    setProgress(0);
    setIsProcessingComplete(false);
    setLastPdfUrl(null);
  };

  const convertToPDF = async (zplContent: string) => {
    if (!zplContent.trim()) {
      toast({
        variant: "destructive",
        title: t('emptyContent'),
        description: t('emptyContentDesc'),
        duration: 3000,
      });
      return;
    }

    setIsConverting(true);
    setProgress(0);
    setIsProcessingComplete(false);
    setLastPdfUrl(null);
    
    const startTime = Date.now();
    console.log('🚀 Starting standard PDF conversion process...');

    try {
      const labels = parseLabelsFromZpl(zplContent);
      console.log(`📊 Converting ${labels.length} labels to PDF (standard format)`);

      if (labels.length === 0) {
        throw new Error(t('noValidLabels'));
      }

      const pdfs = await convertZplBlocksToPdfs(labels, setProgress);
      console.log(`✅ Generated ${pdfs.length} PDF blocks`);

      if (pdfs.length === 0) {
        throw new Error(t('noPdfsGenerated'));
      }

      setProgress(85);
      const mergedPdf = await mergePDFs(pdfs);
      console.log(`📄 Merged PDF size: ${mergedPdf.size} bytes`);

      setProgress(95);
      const fileName = `etiquetas-${Date.now()}.pdf`;
      const pdfPath = await uploadPdf(mergedPdf, fileName);
      console.log(`☁️ Uploaded PDF to: ${pdfPath}`);

      const endTime = Date.now();
      const processingTime = endTime - startTime;
      console.log(`⏱️ Standard conversion completed in ${processingTime}ms`);

      await addToProcessingHistory(labels.length, pdfPath, processingTime, 'standard');

      const { data: publicUrlData } = await supabase.storage
        .from('pdfs')
        .getPublicUrl(pdfPath);

      if (publicUrlData?.publicUrl) {
        setLastPdfUrl(publicUrlData.publicUrl);
        setProgress(100);
        setIsProcessingComplete(true);
        setHistoryRefreshTrigger(prev => prev + 1);

        toast({
          title: t('conversionComplete'),
          description: t('conversionCompleteDesc', { count: labels.length }),
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Standard conversion failed:', error);
      
      toast({
        variant: "destructive",
        title: t('conversionError'),
        description: error instanceof Error ? error.message : t('unknownError'),
        duration: 5000,
      });
    } finally {
      setIsConverting(false);
    }
  };

  return {
    isConverting,
    progress,
    isProcessingComplete,
    lastPdfUrl,
    convertToPDF,
    resetProcessingStatus,
    historyRefreshTrigger,
  };
};
