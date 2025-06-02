
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { mergePDFs } from '@/utils/pdfUtils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';

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

  const { uploadPDFToStorage } = useUploadPdf();
  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl, countLabelsInZpl } = useZplApiConversion();
  const { ensurePdfBucketExists } = useStorageOperations();

  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
  };

  const convertToPDF = async (zplContent: string) => {
    if (!zplContent) return;
    
    try {
      console.log('=== STARTING ZPL TO PDF CONVERSION ===');
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);

      // Parse labels e count
      const labels = parseLabelsFromZpl(zplContent);
      const actualLabelCount = countLabelsInZpl(zplContent);
      
      console.log('Labels parsed:', labels.length);
      console.log('Actual label count:', actualLabelCount);
      
      if (labels.length === 0) {
        throw new Error('Nenhuma etiqueta válida encontrada no conteúdo ZPL');
      }

      // Converter labels para PDFs
      console.log('Starting PDF conversion for', labels.length, 'labels');
      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue);
      });

      console.log('PDF conversion completed, generated PDFs:', pdfs.length);

      if (pdfs.length === 0) {
        throw new Error("Nenhum PDF foi gerado com sucesso.");
      }

      // Atualizar progresso para merge
      setProgress(90);
      console.log('Starting PDF merge process...');

      // Merge dos PDFs
      const mergedPdf = await mergePDFs(pdfs);
      console.log('PDF merge completed, final size:', mergedPdf.size, 'bytes');
      
      setProgress(95);

      // Upload para storage
      console.log('Uploading merged PDF to storage...');
      await ensurePdfBucketExists();
      
      try {
        const pdfPath = await uploadPDFToStorage(mergedPdf);
        console.log('Successfully uploaded PDF to storage:', pdfPath);
        setLastPdfPath(pdfPath);
        
        // Criar blob URL para download imediato
        const blobUrl = window.URL.createObjectURL(mergedPdf);
        setLastPdfUrl(blobUrl);
        
        // Salvar no histórico
        if (pdfPath) {
          await addToProcessingHistory(actualLabelCount, pdfPath);
          setHistoryRefreshTrigger(prev => prev + 1);
          console.log('Processing history updated');
        }
        
        // Download automático
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setProgress(100);
        setIsProcessingComplete(true);

        toast({
          title: t('success'),
          description: t('successMessage'),
          duration: 3000,
        });
        
      } catch (uploadError) {
        console.error('Error uploading to storage:', uploadError);
        
        // Mesmo com erro de upload, criar blob URL para download
        const blobUrl = window.URL.createObjectURL(mergedPdf);
        setLastPdfUrl(blobUrl);
        
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setProgress(100);
        setIsProcessingComplete(true);

        toast({
          title: t('success'),
          description: 'PDF gerado com sucesso (erro no upload para histórico)',
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: `Erro na conversão: ${error.message}`,
        duration: 5000,
      });
    } finally {
      setIsConverting(false);
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
