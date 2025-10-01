
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
      let downloadUrl: string | null = null;
      
      // Priority 1: Use pdfPath to get public URL (most reliable for persisted files)
      if (record.pdfPath) {
        console.log('Getting public URL from storage path:', record.pdfPath);
        
        const { data } = supabase.storage
          .from('pdfs')
          .getPublicUrl(record.pdfPath);
          
        if (data?.publicUrl) {
          console.log('Public URL obtained:', data.publicUrl);
          downloadUrl = data.publicUrl;
        }
      }
      
      // Priority 2: Use pdfUrl directly if it's not a blob (fallback)
      if (!downloadUrl && record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        console.log('Using direct pdfUrl:', record.pdfUrl);
        downloadUrl = record.pdfUrl;
      }
      
      // Priority 3: Use blob URL if available (only works in current session)
      if (!downloadUrl && record.pdfUrl && record.pdfUrl.startsWith('blob:')) {
        console.log('Attempting to use blob URL:', record.pdfUrl);
        
        try {
          const response = await fetch(record.pdfUrl, { method: 'HEAD' });
          if (response.ok) {
            downloadUrl = record.pdfUrl;
            console.log('Blob URL is valid');
          }
        } catch (e) {
          console.error('Blob URL is no longer valid:', e);
        }
      }
      
      // If we have a valid URL, initiate download
      if (downloadUrl) {
        console.log('Initiating download from:', downloadUrl);
        
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `etiquetas-${new Date(record.date).toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`;
        a.style.display = 'none';
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
      
      // If we reach here, no valid URL was found
      console.error('No valid PDF URL or path available:', record);
      throw new Error('Arquivo não encontrado. O PDF pode ter sido removido do storage.');
      
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: error instanceof Error ? error.message : t('downloadError'),
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
