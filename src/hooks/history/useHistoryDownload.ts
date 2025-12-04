
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryDownload() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(null);
  const [currentRecord, setCurrentRecord] = useState<ProcessingRecord | null>(null);
  
  const openPdfModal = (url: string, record: ProcessingRecord) => {
    setCurrentPdfUrl(url);
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const closePdfModal = () => {
    setIsModalOpen(false);
  };
  
  const handleDownload = async (record: ProcessingRecord) => {
    try {
      // Get current user for folder path
      const { data: { user } } = await supabase.auth.getUser();
      
      // For records that have a storage path, try to create signed URL
      if (record.pdfPath) {
        console.log('Downloading from storage path:', record.pdfPath);
        
        // Try the path as-is first (for new records with user folder)
        let { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 3600);
          
        // If failed and user exists, try with user folder prefix (for old records without folder)
        if (error && user && !record.pdfPath.includes('/')) {
          console.log('Trying with user folder prefix...');
          const userFolderPath = `${user.id}/${record.pdfPath}`;
          const result = await supabase.storage
            .from('pdfs')
            .createSignedUrl(userFolderPath, 3600);
          data = result.data;
          error = result.error;
        }
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          throw new Error('Failed to create download URL - file may no longer exist');
        }
        
        console.log('Signed URL created successfully');
        openPdfModal(data.signedUrl, record);
        return;
      }
      
      // Try to extract path from old public URLs and create signed URL
      if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        console.log('Trying to extract path from URL:', record.pdfUrl);
        // Extract the file path from the public URL (format: .../storage/v1/object/public/pdfs/...)
        const match = record.pdfUrl.match(/\/pdfs\/(.+)$/);
        if (match && match[1]) {
          const extractedPath = match[1];
          console.log('Extracted path:', extractedPath);
          
          const { data, error } = await supabase.storage
            .from('pdfs')
            .createSignedUrl(extractedPath, 3600);
            
          if (!error && data?.signedUrl) {
            openPdfModal(data.signedUrl, record);
            return;
          }
          console.error('Failed to create signed URL from extracted path:', error);
        }
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
          
          openPdfModal(record.pdfUrl, record);
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

  const downloadCurrentPdf = () => {
    if (!currentPdfUrl || !currentRecord) return;
    
    try {
      // Create download link with the signed URL
      const a = document.createElement('a');
      a.href = currentPdfUrl;
      a.download = 'etiquetas.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: t('downloadStarted'),
        description: t('downloadStartedDesc'),
        duration: 3000,
      });
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

  return { 
    handleDownload,
    isModalOpen,
    currentPdfUrl,
    closePdfModal,
    downloadCurrentPdf
  };
}
