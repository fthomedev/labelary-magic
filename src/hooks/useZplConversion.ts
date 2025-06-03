
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

  const { uploadPDFToStorage, getPdfPublicUrl } = useUploadPdf();
  const { addToProcessingHistory } = useHistoryRecords();
  const { convertZplBlocksToPdfs, parseLabelsFromZpl, countLabelsInZpl } = useZplApiConversion();
  const { ensurePdfBucketExists } = useStorageOperations();

  // New function to reset processing status
  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
  };

  const convertToPDF = async (zplContent: string) => {
    if (!zplContent) return;
    
    try {
      setIsConverting(true);
      setProgress(0);
      setPdfUrls([]);
      setIsProcessingComplete(false);

      const labels = parseLabelsFromZpl(zplContent);
      const newPdfUrls: string[] = [];

      const pdfs = await convertZplBlocksToPdfs(labels, (progressValue) => {
        setProgress(progressValue);
      });

      // Create temporary blob URLs for the current session
      pdfs.forEach(blob => {
        const blockUrl = window.URL.createObjectURL(blob);
        newPdfUrls.push(blockUrl);
      });
      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          const mergedPdf = await mergePDFs(pdfs);
          
          // Ensure bucket exists
          await ensurePdfBucketExists();
          
          // Upload PDF to storage
          let pdfPath;
          try {
            pdfPath = await uploadPDFToStorage(mergedPdf);
            console.log('Successfully uploaded PDF to storage:', pdfPath);
            setLastPdfPath(pdfPath);
            
            // Get the temporary blob URL for the current session
            const blobUrl = window.URL.createObjectURL(mergedPdf);
            setLastPdfUrl(blobUrl);
            
            const actualLabelCount = countLabelsInZpl(zplContent);
            
            // Only add to history if we have a valid path
            if (pdfPath) {
              await addToProcessingHistory(actualLabelCount, pdfPath);
              setHistoryRefreshTrigger(prev => prev + 1);
            }
            
            // Download the file
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = 'etiquetas.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast({
              title: t('success'),
              description: t('successMessage'),
              duration: 3000,
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
      setProgress(100); // Ensure progress is complete even if there was an error
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
    resetProcessingStatus,  // Expose the new function
  };
};
