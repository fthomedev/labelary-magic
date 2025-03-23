
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { processZPLContent } from '@/utils/labelProcessingService';

export interface ProcessingRecord {
  id: string;
  date: Date;
  labelCount: number;
  pdfUrl: string;
}

export const useZplConversion = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { t } = useTranslation();

  const convertToPDF = useCallback(async (zplContent: string) => {
    if (!zplContent || zplContent.trim() === '') {
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('noZplContent'),
      });
      return;
    }
    
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);
      setLastPdfUrl(undefined);

      const result = await processZPLContent(zplContent, {
        onProgress: (progressValue) => {
          setProgress(progressValue);
        },
        onComplete: (finalUrl) => {
          setLastPdfUrl(finalUrl);
          setIsProcessingComplete(true);
          
          toast({
            title: t('success'),
            description: t('successMessage'),
          });
          
          // Auto-download the PDF
          const a = document.createElement('a');
          a.href = finalUrl;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        },
        onError: (errorMessage) => {
          toast({
            variant: "destructive",
            title: t('error'),
            description: errorMessage,
          });
        },
        getTranslation: (key, options) => String(t(key, options)) // Convert translation result to string
      });
      
      setPdfUrls(result.pdfUrls);
      
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : String(t('errorMessage')), // Convert to string
      });
    } finally {
      setIsConverting(false);
      setProgress(100);
    }
  }, [t, toast]);

  return {
    isConverting,
    progress,
    pdfUrls,
    isProcessingComplete,
    lastPdfUrl,
    convertToPDF,
  };
};
