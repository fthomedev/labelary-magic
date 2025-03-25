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

  const uploadPDFToStorage = async (pdfBlob: Blob): Promise<string> => {
    try {
      const fileName = `label-${uuidv4()}.pdf`;
      const filePath = `${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading PDF to storage:', error);
        throw error;
      }
      
      console.log('PDF uploaded to storage:', filePath);
      return filePath;
    } catch (error) {
      console.error('Failed to upload PDF to storage:', error);
      throw error;
    }
  };

  const addToProcessingHistory = async (labelCount: number, pdfUrl: string, pdfPath?: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Saving processing history for user:', user.id);
        
        if (pdfPath) {
          const { error } = await supabase.from('processing_history').insert({
            user_id: user.id,
            label_count: labelCount,
            pdf_url: pdfUrl,
            pdf_path: pdfPath
          });
          
          if (error) {
            console.error('Error saving processing history with pdf_path:', error);
            if (error.message.includes('pdf_path')) {
              const { error: fallbackError } = await supabase.from('processing_history').insert({
                user_id: user.id,
                label_count: labelCount,
                pdf_url: pdfUrl
              });
              
              if (fallbackError) {
                console.error('Error with fallback insert:', fallbackError);
              } else {
                console.log('Processing history saved without pdf_path');
              }
            }
          } else {
            console.log('Processing history saved with pdf_path successfully');
          }
        } else {
          const { error } = await supabase.from('processing_history').insert({
            user_id: user.id,
            label_count: labelCount,
            pdf_url: pdfUrl
          });
          
          if (error) {
            console.error('Error saving processing history:', error);
          } else {
            console.log('Processing history saved without pdf_path');
          }
        }
      } else {
        console.log('No authenticated user found');
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
            title: t('blockError'),
            description: t('blockErrorMessage', { block: i / LABELS_PER_REQUEST + 1 }),
            duration: 4000,
          });
        }
      }

      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          const mergedPdf = await mergePDFs(pdfs);
          
          let pdfPath;
          try {
            pdfPath = await uploadPDFToStorage(mergedPdf);
            console.log('Successfully uploaded PDF to storage:', pdfPath);
          } catch (uploadError) {
            console.error('Error uploading to storage, continuing without persistent storage:', uploadError);
          }
          
          try {
            const { error: bucketError } = await supabase.storage.getBucket('pdfs');
            if (bucketError && bucketError.message.includes('The resource was not found')) {
              await supabase.storage.createBucket('pdfs', {
                public: true,
                fileSizeLimit: 10485760 // 10MB
              });
              
              await supabase.storage.updateBucket('pdfs', {
                public: true
              });
            }
          } catch (bucketError) {
            console.error('Error with bucket operations:', bucketError);
          }
          
          const blobUrl = window.URL.createObjectURL(mergedPdf);
          setLastPdfUrl(blobUrl);
          
          if (pdfPath) {
            setLastPdfPath(pdfPath);
          }
          
          const countXAMarkers = (zplContent.match(/\^XA/g) || []).length;
          const actualLabelCount = Math.ceil(countXAMarkers / 2);
          
          await addToProcessingHistory(actualLabelCount, blobUrl, pdfPath);
          
          setHistoryRefreshTrigger(prev => prev + 1);
          
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
          
          setIsProcessingComplete(true);
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
      setProgress(0);
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
  };
};
