
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

  const fetchZPLWithRetry = async (zplContent: string, retryCount = 0, maxRetries = 3): Promise<Blob> => {
    try {
      console.log(`Attempting ZPL conversion, attempt ${retryCount + 1}/${maxRetries + 1}`);
      
      const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
        method: 'POST',
        headers: {
          'Accept': 'application/pdf',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: zplContent,
      });

      if (response.status === 429) {
        // Rate limit hit, wait longer and retry
        console.log('Rate limit hit, waiting before retry...');
        if (retryCount < maxRetries) {
          const waitTime = Math.pow(2, retryCount) * 1500; // Exponential backoff
          await delay(waitTime);
          return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
        } else {
          throw new Error(t('rateLimitExceeded'));
        }
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API Error: ${response.status} ${response.statusText}, ${errorText}`);
        throw new Error(`${t('apiError')}: ${response.status} ${response.statusText}`);
      }

      const blob = await response.blob();
      
      // Validate blob size to ensure it's not an empty or invalid PDF
      if (blob.size < 500) { // Increased minimum size check
        console.warn(`Suspiciously small PDF received (${blob.size} bytes), may be invalid`);
        if (retryCount < maxRetries) {
          await delay(2000);
          return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
        } else {
          throw new Error(t('invalidPdfResponse'));
        }
      }
      
      return blob;
    } catch (error) {
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1500;
        console.log(`Error in fetch, retrying in ${waitTime}ms...`, error);
        await delay(waitTime);
        return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
      }
      throw error;
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
      
      // Process strictly one label at a time to avoid API rate limits and improve reliability
      const LABELS_PER_REQUEST = 1;
      
      for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
        try {
          const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
          const blockZPL = blockLabels.join('\n');
          
          console.log(`Processing label ${i + 1}/${labels.length}, ZPL size: ${blockZPL.length} chars`);
          
          // Validate ZPL format
          const validFormat = blockLabels.every(label => 
            label.trim().startsWith('^XA') && 
            label.trim().endsWith('^XZ') &&
            label.length > 10
          );
          
          if (!validFormat) {
            console.warn('Invalid ZPL block detected and skipped');
            continue;
          }

          // Use the retry function to handle rate limiting and errors
          const blob = await fetchZPLWithRetry(blockZPL);
          console.log(`PDF received for label ${i + 1}: ${blob.size} bytes`);
          
          // Additional validation for the returned PDF
          if (blob.size > 500) {
            pdfs.push(blob);
            const blockUrl = URL.createObjectURL(blob);
            newPdfUrls.push(blockUrl);
          } else {
            console.warn(`Skipping too small PDF for label ${i + 1} (${blob.size} bytes)`);
          }

          // Update progress
          setProgress(((i + 1) / labels.length) * 100);

          // Add significant delay between requests to avoid rate limiting
          if (i + LABELS_PER_REQUEST < labels.length) {
            await delay(2000);
          }
        } catch (error) {
          console.error(`Error processing label ${i + 1}:`, error);
          
          // Show warning but continue with other labels
          toast({
            variant: "warning",
            title: t('warning'),
            description: t('labelError', { label: i + 1 }),
          });
          
          // Still update progress
          setProgress(((i + 1) / labels.length) * 100);
          
          // Add extra delay after an error
          await delay(3000);
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
