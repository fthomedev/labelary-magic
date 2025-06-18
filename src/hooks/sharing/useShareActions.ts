
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useUrlShortener } from './useUrlShortener';
import { useWhatsAppDetection } from './useWhatsAppDetection';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { supabase } from '@/integrations/supabase/client';

export const useShareActions = (record: ProcessingRecord | null) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();
  const { shortenUrl, isShortening } = useUrlShortener();
  const { openWhatsApp } = useWhatsAppDetection();
  const { getPdfPublicUrl } = useUploadPdf();

  const getFileUrl = async (): Promise<string | null> => {
    if (!record) return null;

    try {
      if (record.pdfPath) {
        // Get signed URL from storage
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 3600);
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          throw new Error('Failed to create download URL');
        }
        
        return data.signedUrl;
      } else if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        return record.pdfUrl;
      }
      
      throw new Error('No valid PDF URL available');
    } catch (error) {
      console.error('Error getting file URL:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível obter o link do arquivo",
      });
      return null;
    }
  };

  const handleWhatsAppShare = async () => {
    const fileUrl = await getFileUrl();
    if (!fileUrl) return;
    
    const shortUrl = await shortenUrl(fileUrl);
    const message = `Confira este arquivo PDF: ${shortUrl}`;
    openWhatsApp(message);
    
    toast({
      title: "Compartilhamento iniciado",
      description: "Abrindo WhatsApp...",
    });
  };

  const handleGeneratePublicLink = async () => {
    setIsGeneratingLink(true);
    
    try {
      const fileUrl = await getFileUrl();
      if (!fileUrl) return;
      
      const shortUrl = await shortenUrl(fileUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shortUrl);
      
      toast({
        title: "Link copiado!",
        description: "O link público foi copiado para a área de transferência",
      });
    } catch (error) {
      console.error('Error generating public link:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o link público",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return {
    handleWhatsAppShare,
    handleGeneratePublicLink,
    isGeneratingLink,
    isShortening,
  };
};
