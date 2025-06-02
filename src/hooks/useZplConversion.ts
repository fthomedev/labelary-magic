import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { mergePDFs } from '@/utils/pdfUtils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useHistoryRecords } from '@/hooks/history/useHistoryRecords';
import { useZplApiConversion } from '@/hooks/conversion/useZplApiConversion';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { generateSheetFromPngs, convertPngToPdf } from '@/utils/sheetPngGenerator';
import { getMaxLabelsPerSheet } from '@/utils/sheetLayout';

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
  const { convertZplBlocksToPdfs, convertZplBlocksToPngs, parseLabelsFromZpl, countLabelsInZpl } = useZplApiConversion();
  const { ensurePdfBucketExists } = useStorageOperations();

  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
  };

  const convertToPDF = async (zplContent: string, sheetConfig?: SheetConfig) => {
    if (!zplContent) return;
    
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);

      console.log('Starting conversion with sheet config:', sheetConfig);

      const labels = parseLabelsFromZpl(zplContent);
      const actualLabelCount = countLabelsInZpl(zplContent);
      
      console.log('Labels parsed:', labels.length, 'Actual count:', actualLabelCount);

      // SEMPRE usar modo direto PDF (sheet mode desabilitado temporariamente)
      console.log('Using optimized direct PDF conversion');
      
      toast({
        title: t('processingStarted'),
        description: t('convertingDirectlyToPdf'),
        duration: 2000,
      });

      // Direct PDF conversion - much faster
      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue * 0.85); // 85% for conversion
      });

      console.log(`Successfully converted ${pdfs.length} PDF blocks`);

      if (pdfs.length > 0) {
        setProgress(90); // 90% for merge
        
        try {
          const mergedPdf = await mergePDFs(pdfs);
          console.log('Merged PDF size:', mergedPdf.size, 'bytes');
          
          setProgress(95); // 95% for upload
          
          await ensurePdfBucketExists();
          
          const pdfPath = await uploadPDFToStorage(mergedPdf);
          console.log('Successfully uploaded PDF to storage:', pdfPath);
          setLastPdfPath(pdfPath);
          
          const blobUrl = window.URL.createObjectURL(mergedPdf);
          setLastPdfUrl(blobUrl);
          
          if (pdfPath) {
            await addToProcessingHistory(actualLabelCount, pdfPath);
            setHistoryRefreshTrigger(prev => prev + 1);
          }
          
          // Auto download
          const a = document.createElement('a');
          a.href = blobUrl;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);

          setProgress(100); // 100% complete

          toast({
            title: t('success'),
            description: t('successMessage'),
            duration: 3000,
          });
          
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
      } else {
        throw new Error("No PDFs were generated successfully.");
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
