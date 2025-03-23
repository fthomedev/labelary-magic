
import { useState, useCallback } from 'react';
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
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('Saving processing history for user:', user.id);
        
        // Call the RPC function to insert processing history
        const { error } = await (supabase.rpc as any)('insert_processing_history', {
          p_user_id: user.id,
          p_label_count: labelCount,
          p_pdf_url: pdfUrl
        });
        
        if (error) {
          console.error('Error saving processing history:', error);
          return;
        }
        
        console.log('Processing history saved successfully');
        
        // Force refresh session to ensure auth is still valid
        await supabase.auth.refreshSession();
      } else {
        console.log('No authenticated user found');
      }
    } catch (error) {
      console.error('Failed to save processing history to database:', error);
    }
  };

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

      // Split ZPL content into valid ZPL blocks
      const labels = splitZPLIntoBlocks(zplContent);
      console.log(`Total labels found: ${labels.length}`);
      
      if (labels.length === 0) {
        throw new Error(t('noValidZplBlocks'));
      }
      
      const pdfs: Blob[] = [];
      const newPdfUrls: string[] = [];
      // Reducing to avoid payload size issues and API rate limits
      const LABELS_PER_REQUEST = 1; // Reduced from 3 to 1 for more reliable processing
      
      for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
        try {
          const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
          const blockZPL = blockLabels.join('\n');
          
          console.log(`Sending block ${Math.floor(i/LABELS_PER_REQUEST) + 1}, with ${blockLabels.length} labels`);
          console.log(`ZPL block size: ${blockZPL.length} characters`);
          
          // Check if ZPL has valid format (starts with ^XA and ends with ^XZ)
          const validFormat = blockLabels.every(label => label.trim().startsWith('^XA') && label.trim().endsWith('^XZ'));
          if (!validFormat) {
            console.warn('ZPL block with incorrect format detected');
            continue; // Skip this block if it's invalid
          }

          const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
            method: 'POST',
            headers: {
              'Accept': 'application/pdf',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: blockZPL,
          });

          if (!response.ok) {
            console.error(`API Error: ${response.status} ${response.statusText}`);
            const errorText = await response.text();
            console.error(`Error details: ${errorText}`);
            
            // Even if this block fails, continue with other blocks
            toast({
              variant: "destructive",
              title: t('warning'),
              description: t('blockErrorSkipped', { block: Math.floor(i / LABELS_PER_REQUEST) + 1 }),
            });
            
            // Update progress even for failed blocks
            setProgress(((i + blockLabels.length) / labels.length) * 100);
            continue;
          }

          const blob = await response.blob();
          console.log(`PDF received: ${blob.size} bytes`);
          
          if (blob.size < 1000) {
            console.warn('PDF is too small, possible error in ZPL content');
            continue; // Skip this PDF if it appears invalid
          }
          
          pdfs.push(blob);

          const blockUrl = URL.createObjectURL(blob);
          newPdfUrls.push(blockUrl);

          setProgress(((i + blockLabels.length) / labels.length) * 100);

          // Add delay between requests to avoid rate limiting
          if (i + LABELS_PER_REQUEST < labels.length) {
            await delay(1000); // Increased delay to avoid API rate limits
          }
        } catch (error) {
          console.error(`${t('blockError')} ${Math.floor(i / LABELS_PER_REQUEST) + 1}:`, error);
          toast({
            variant: "destructive",
            title: t('warning'),
            description: t('blockErrorMessage', { block: Math.floor(i / LABELS_PER_REQUEST) + 1 }),
          });
          
          // Continue with other blocks rather than failing completely
        }
      }

      setPdfUrls(newPdfUrls);

      if (pdfs.length > 0) {
        try {
          console.log(`Merging ${pdfs.length} PDFs`);
          const mergedPdf = await mergePDFs(pdfs);
          console.log(`Final PDF generated: ${mergedPdf.size} bytes`);
          
          if (mergedPdf.size < 1000) {
            throw new Error(t('pdfInvalid'));
          }
          
          const finalUrl = URL.createObjectURL(mergedPdf);
          
          setLastPdfUrl(finalUrl);
          
          const totalLabels = labels.length;
          await addToProcessingHistory(totalLabels, finalUrl);

          toast({
            title: t('success'),
            description: t('successMessage'),
          });
          
          setIsProcessingComplete(true);
          
          // Auto-download the PDF
          const a = document.createElement('a');
          a.href = finalUrl;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (error) {
          console.error('Error merging PDFs:', error);
          toast({
            variant: "destructive",
            title: t('error'),
            description: t('mergePdfError'),
          });
        }
      } else {
        throw new Error(t('noPdfsGenerated'));
      }
    } catch (error) {
      console.error('Conversion error:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('errorMessage'),
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
