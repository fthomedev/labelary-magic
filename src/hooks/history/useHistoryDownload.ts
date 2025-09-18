
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
      // For records that have a storage path, always use that (more reliable after page refresh)
      if (record.pdfPath) {
        console.log('Downloading from storage path:', record.pdfPath);
        
        // Get direct download URL with proper authorization
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 3600); // 60 minutes expiration for better viewing experience
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          throw new Error('Failed to create download URL');
        }
        
        console.log('Signed URL created successfully:', data.signedUrl);
        
        // Direct download instead of opening modal
        const a = document.createElement('a');
        a.href = data.signedUrl;
        a.download = `etiquetas-${new Date(record.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('Download initiated successfully');
        
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
        
        // Direct download
        const a = document.createElement('a');
        a.href = record.pdfUrl;
        a.download = `etiquetas-${new Date(record.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        console.log('Download initiated from direct URL');
        
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
          
          // Direct download from blob URL
          const a = document.createElement('a');
          a.href = record.pdfUrl;
          a.download = `etiquetas-${new Date(record.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
          a.style.display = 'none';
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          console.log('Download initiated from blob URL');
          
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
