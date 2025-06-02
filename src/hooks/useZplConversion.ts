
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

      if (sheetConfig?.enabled) {
        // Sheet mode: existing logic for PNG conversion
        const maxLabelsPerSheet = getMaxLabelsPerSheet(sheetConfig);
        console.log('Max labels per sheet:', maxLabelsPerSheet);
        
        const sheets: Blob[] = [];
        
        toast({
          title: t('sheetModeEnabled'),
          description: t('processingLabelsForSheet'),
          duration: 3000,
        });

        for (let i = 0; i < labels.length; i += maxLabelsPerSheet) {
          const sheetLabels = labels.slice(i, i + maxLabelsPerSheet);
          const sheetNumber = Math.floor(i / maxLabelsPerSheet) + 1;
          console.log(`Processing sheet ${sheetNumber}, labels: ${sheetLabels.length}`);
          
          try {
            const baseProgress = (i / labels.length) * 85;
            const pngs = await convertZplBlocksToPngs(sheetLabels, (progressValue) => {
              const currentProgress = baseProgress + (progressValue / 100) * (85 / Math.ceil(labels.length / maxLabelsPerSheet));
              setProgress(Math.min(currentProgress, 85));
            });

            console.log(`Converted ${pngs.length} labels to PNG for sheet ${sheetNumber}`);

            if (pngs.length > 0) {
              setProgress(85 + ((sheetNumber - 1) / Math.ceil(labels.length / maxLabelsPerSheet)) * 10);
              
              const sheetPng = await generateSheetFromPngs(pngs, sheetConfig);
              console.log('Generated sheet PNG, size:', sheetPng.size, 'bytes');
              
              const sheetPdf = await convertPngToPdf(sheetPng);
              console.log('Converted sheet to PDF, size:', sheetPdf.size, 'bytes');
              sheets.push(sheetPdf);
            }
          } catch (sheetError) {
            console.error(`Error processing sheet ${sheetNumber}:`, sheetError);
            toast({
              variant: "destructive",
              title: t('error'),
              description: `Erro na folha ${sheetNumber}: ${sheetError.message}`,
              duration: 5000,
            });
          }
        }

        if (sheets.length > 0) {
          setProgress(95);
          
          try {
            const mergedPdf = sheets.length > 1 ? await mergePDFs(sheets) : sheets[0];
            console.log('Final merged PDF size:', mergedPdf.size, 'bytes');
            
            setProgress(98);
            
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
            
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = `etiquetas-folha-${sheetConfig.sheetSize}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setProgress(100);

            toast({
              title: t('success'),
              description: t('sheetSuccessMessage'),
              duration: 3000,
            });
            
            setIsProcessingComplete(true);
          } catch (finalError) {
            console.error('Error in final processing:', finalError);
            throw finalError;
          }
        } else {
          throw new Error("No sheets were generated successfully.");
        }
      } else {
        // OPTIMIZED: Direct PDF conversion mode (no PNG conversion needed)
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
