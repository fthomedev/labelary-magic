
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { splitZPLIntoBlocks, delay, mergePDFs } from '@/utils/pdfUtils';
import { supabase } from '@/integrations/supabase/client';

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

  const addToProcessingHistory = async (labelCount: number, pdfUrl: string) => {
    try {
      const user = await supabase.auth.getUser();
      if (user && user.data.user) {
        // Use a generic query to work around type issues
        await supabase.rpc('insert_processing_history', {
          p_user_id: user.data.user.id,
          p_label_count: labelCount,
          p_pdf_url: pdfUrl
        } as any);
      }
    } catch (error) {
      console.error('Failed to save processing history to database:', error);
    }
  };

  const convertToPDF = async (zplContent: string) => {
    if (!zplContent) return;
    
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);

      const labels = splitZPLIntoBlocks(zplContent);
      const pdfs: Blob[] = [];
      const LABELS_PER_REQUEST = 14;
      const newPdfUrls: string[] = [];

      for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
        try {
          const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
          const blockZPL = blockLabels.join('');

          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const blob = await response.blob();
          pdfs.push(blob);

          const blockUrl = window.URL.createObjectURL(blob);
          newPdfUrls.push(blockUrl);

          setProgress(((i + blockLabels.length) / labels.length) * 100);

          if (i + LABELS_PER_REQUEST < labels.length) {
            await delay(3000);
          }
        } catch (error) {
          console.error(`${t('blockError')} ${i / LABELS_PER_REQUEST + 1}:`, error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('blockErrorMessage', { block: i / LABELS_PER_REQUEST + 1 }),
          });
        }
      }

      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          const mergedPdf = await mergePDFs(pdfs);
          const url = window.URL.createObjectURL(mergedPdf);
          
          setLastPdfUrl(url);
          
          const totalLabels = labels.length;
          await addToProcessingHistory(totalLabels, url);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          toast({
            title: t('success'),
            description: t('successMessage'),
          });
          
          setIsProcessingComplete(true);
        } catch (error) {
          console.error('Erro ao mesclar PDFs:', error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mergePdfError'),
          });
        }
      } else {
        throw new Error("Nenhum PDF foi gerado com sucesso.");
      }
    } catch (error) {
      console.error('Erro na conversão:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorMessage'),
      });
    } finally {
      setIsConverting(false);
      setProgress(0);
    }
  };

  return {
    isConverting,
    progress,
    pdfUrls,
    isProcessingComplete,
    lastPdfUrl,
    convertToPDF,
  };
};
