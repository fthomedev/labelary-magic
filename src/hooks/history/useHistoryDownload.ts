
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryDownload() {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const handleDownload = async (record: ProcessingRecord) => {
    try {
      // For records that have a storage path, always use that (more reliable after page refresh)
      if (record.pdfPath) {
        console.log('Downloading from storage path:', record.pdfPath);
        
        // Get direct download URL with proper authorization
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 60); // 60 seconds expiration
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          throw new Error('Failed to create download URL');
        }
        
        console.log('Signed URL created successfully:', data.signedUrl);
        
        // Create download link with the signed URL
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: t('downloadStarted'),
          description: t('downloadStartedDesc'),
          duration: 3000,
        });
        
        return;
      } 
      
      // If the pdfUrl is a complete URL (not a blob), use that directly
      if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        console.log('Using direct URL from Supabase:', record.pdfUrl);
        
        const a = document.createElement('a');
        a.href = record.pdfUrl;
        a.download = 'etiquetas.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        toast({
          title: t('downloadStarted'),
          description: t('downloadStartedDesc'),
          duration: 3000,
        });
        
        return;
      }
      
      // Fallback to blob URL if available (for newly created PDFs)
      // Note: This will only work during the current session before a page refresh
      if (record.pdfUrl && record.pdfUrl.startsWith('blob:')) {
        console.log('Trying to use blob URL:', record.pdfUrl);
        
        // Check if the blob URL is still valid
        try {
          // This fetch will fail if the blob URL is no longer valid
          const response = await fetch(record.pdfUrl, { method: 'HEAD' });
          
          if (!response.ok) {
            throw new Error('Blob URL is no longer valid');
          }
          
          const a = document.createElement('a');
          a.href = record.pdfUrl;
          a.download = 'etiquetas.pdf';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          toast({
            title: t('downloadStarted'),
            description: t('downloadStartedDesc'),
            duration: 3000,
          });
          
          return;
        } catch (e) {
          console.error('Error with blob URL:', e);
          throw new Error('Blob URL is no longer accessible after page refresh');
        }
      }
      
      // If we reach here, we don't have a valid way to download the file
      console.error('No valid PDF URL or path available:', record);
      throw new Error('No valid PDF URL or path available');
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('downloadError'),
        duration: 3000,
      });
    }
  };

  return { handleDownload };
}
