
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

  // New function to reset processing status
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

      if (sheetConfig?.enabled) {
        // Modo folha: converter para PNG e combinar
        const maxLabelsPerSheet = getMaxLabelsPerSheet(sheetConfig);
        console.log('Max labels per sheet:', maxLabelsPerSheet);
        
        const sheets: Blob[] = [];
        
        toast({
          title: t('sheetModeEnabled'),
          description: t('processingLabelsForSheet'),
          duration: 3000,
        });

        // Processar etiquetas em lotes por folha
        for (let i = 0; i < labels.length; i += maxLabelsPerSheet) {
          const sheetLabels = labels.slice(i, i + maxLabelsPerSheet);
          console.log(`Processing sheet ${Math.floor(i / maxLabelsPerSheet) + 1}, labels: ${sheetLabels.length}`);
          
          // Converter etiquetas para PNG
          const pngs = await convertZplBlocksToPngs(sheetLabels, (progressValue) => {
            const sheetProgress = (i / labels.length) * 80; // 80% para conversão
            const currentProgress = (progressValue / 100) * (80 / Math.ceil(labels.length / maxLabelsPerSheet));
            setProgress(sheetProgress + currentProgress);
          });

          console.log(`Converted ${pngs.length} labels to PNG for sheet ${Math.floor(i / maxLabelsPerSheet) + 1}`);

          if (pngs.length > 0) {
            // Combinar PNGs em uma folha
            const sheetPng = await generateSheetFromPngs(pngs, sheetConfig);
            console.log('Generated sheet PNG, size:', sheetPng.size, 'bytes');
            
            // Converter PNG da folha para PDF
            const sheetPdf = await convertPngToPdf(sheetPng);
            console.log('Converted sheet to PDF, size:', sheetPdf.size, 'bytes');
            sheets.push(sheetPdf);
          }
        }

        if (sheets.length > 0) {
          setProgress(90);
          
          // Merge all sheet PDFs
          const mergedPdf = sheets.length > 1 ? await mergePDFs(sheets) : sheets[0];
          console.log('Final merged PDF size:', mergedPdf.size, 'bytes');
          
          // Continue with upload and download...
          await ensurePdfBucketExists();
          
          try {
            const pdfPath = await uploadPDFToStorage(mergedPdf);
            console.log('Successfully uploaded PDF to storage:', pdfPath);
            setLastPdfPath(pdfPath);
            
            const blobUrl = window.URL.createObjectURL(mergedPdf);
            setLastPdfUrl(blobUrl);
            
            if (pdfPath) {
              await addToProcessingHistory(actualLabelCount, pdfPath);
              setHistoryRefreshTrigger(prev => prev + 1);
            }
            
            // Download the file
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `etiquetas-folha-${sheetConfig.sheetSize}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            toast({
              title: t('success'),
              description: t('sheetSuccessMessage'),
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
        }
      } else {
        // Modo normal: converter para PDF diretamente
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
    resetProcessingStatus,
  };
};
