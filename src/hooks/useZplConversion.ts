
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
  const { toast } = useToast();
  const { t } = useTranslation();

  // Upload PDF to Supabase Storage
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
      
      // Get the public URL for the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('pdfs')
        .getPublicUrl(filePath);
      
      console.log('PDF uploaded to storage:', filePath);
      console.log('Public URL:', publicUrlData.publicUrl);
      
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
        
        try {
          // First, try the updated function with pdf_path parameter
          const { error: updatedError } = await supabase.rpc(
            'insert_processing_history', 
            {
              p_user_id: user.id,
              p_label_count: labelCount,
              p_pdf_url: pdfUrl,
              // Cast to any to bypass TypeScript's strict type checking
              // since our database has the parameter but TypeScript doesn't know yet
              ...(pdfPath ? { p_pdf_path: pdfPath } : {})
            } as any
          );
          
          if (updatedError) {
            console.log('Error with updated function signature, trying original one:', updatedError);
            // If there's an error, try the original function without pdf_path
            const { error } = await supabase.rpc('insert_processing_history', {
              p_user_id: user.id,
              p_label_count: labelCount,
              p_pdf_url: pdfUrl
            });
            
            if (error) {
              console.error('Error saving processing history with original function:', error);
              return;
            }
          }
          
          console.log('Processing history saved successfully');
        } catch (error) {
          console.error('Exception while saving processing history:', error);
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
          });
        }
      }

      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          const mergedPdf = await mergePDFs(pdfs);
          
          // Upload merged PDF to Supabase Storage
          const pdfPath = await uploadPDFToStorage(mergedPdf);
          
          // Get the public URL for the uploaded file
          const { data: publicUrlData } = supabase.storage
            .from('pdfs')
            .getPublicUrl(pdfPath);
            
          const publicUrl = publicUrlData.publicUrl;
          
          // Create a blob URL for immediate download
          const blobUrl = window.URL.createObjectURL(mergedPdf);
          setLastPdfUrl(blobUrl);
          setLastPdfPath(pdfPath);
          
          // Count ^XA markers, divide by 2 and round up
          const countXAMarkers = (zplContent.match(/\^XA/g) || []).length;
          const actualLabelCount = Math.ceil(countXAMarkers / 2);
          
          // Save to processing history with both the temporary blob URL (for immediate use)
          // and the permanent storage path
          await addToProcessingHistory(actualLabelCount, blobUrl, pdfPath);
          
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
          
          setIsProcessingComplete(true);
        } catch (error) {
          console.error('Erro ao mesclar PDFs:', error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mergePdfError'),
            duration: 5000,
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
  };
};
