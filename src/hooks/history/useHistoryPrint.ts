
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryPrint() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handlePrint = useCallback(async (record: ProcessingRecord) => {
    try {
      let pdfUrl: string | null = null;

      // For records that have a storage path, always use that (more reliable after page refresh)
      if (record.pdfPath) {
        console.log('Getting PDF for printing from storage path:', record.pdfPath);
        
        // Get direct download URL with proper authorization
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 300); // 5 minutes expiration for printing
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL for printing:', error);
          throw new Error('Failed to create print URL');
        }
        
        pdfUrl = data.signedUrl;
        console.log('Signed URL created successfully for printing:', pdfUrl);
      } 
      // If the pdfUrl is a complete URL (not a blob), use that directly
      else if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        console.log('Using direct URL from Supabase for printing:', record.pdfUrl);
        pdfUrl = record.pdfUrl;
      }
      // Fallback to blob URL if available (for newly created PDFs)
      else if (record.pdfUrl && record.pdfUrl.startsWith('blob:')) {
        console.log('Trying to use blob URL for printing:', record.pdfUrl);
        
        // Check if the blob URL is still valid
        try {
          const response = await fetch(record.pdfUrl, { method: 'HEAD' });
          
          if (!response.ok) {
            throw new Error('Blob URL is no longer valid');
          }
          
          pdfUrl = record.pdfUrl;
        } catch (e) {
          console.error('Error with blob URL for printing:', e);
          throw new Error('Blob URL is no longer accessible after page refresh');
        }
      }

      if (!pdfUrl) {
        throw new Error('No valid PDF URL or path available for printing');
      }

      // Open the PDF in a new window and trigger print
      const printWindow = window.open(pdfUrl, '_blank');
      
      if (printWindow) {
        // Wait for the PDF to load and then trigger print
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print();
          }, 1000); // Give some time for the PDF to fully load
        };
        
        toast({
          title: t('printStarted'),
          description: t('printStartedDesc'),
          duration: 3000,
        });
      } else {
        throw new Error('Unable to open print window');
      }
      
    } catch (error) {
      console.error('Error printing PDF:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('printError'),
        duration: 3000,
      });
    }
  }, [t, toast]);

  return { handlePrint };
}
