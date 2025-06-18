
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/hooks/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { supabase } from '@/integrations/supabase/client';
import { useUrlShortener } from './useUrlShortener';
import { useWhatsAppDetection } from './useWhatsAppDetection';

export function useShareActions(record: ProcessingRecord | null) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [copyingFile, setCopyingFile] = useState(false);
  const { shortenUrl, isShortening } = useUrlShortener();
  const { openWhatsApp } = useWhatsAppDetection();

  const getFileUrl = async (): Promise<string | null> => {
    if (!record) return null;

    try {
      // If we have a storage path, use that to generate a signed URL
      if (record.pdfPath) {
        const { data, error } = await supabase.storage
          .from('pdfs')
          .createSignedUrl(record.pdfPath, 3600); // 1 hour expiration
          
        if (error || !data?.signedUrl) {
          console.error('Error creating signed URL:', error);
          return null;
        }
        
        return data.signedUrl;
      }
      
      // If we have a direct URL and it's not a blob, use that
      if (record.pdfUrl && !record.pdfUrl.startsWith('blob:')) {
        return record.pdfUrl;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting file URL:', error);
      return null;
    }
  };

  const handleWhatsAppShare = async () => {
    const fileUrl = await getFileUrl();
    if (!fileUrl) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Não foi possível obter o link do arquivo",
        duration: 3000,
      });
      return;
    }

    try {
      const shortUrl = await shortenUrl(fileUrl);
      const message = `Confira este PDF gerado pelo ZPL Easy: ${shortUrl}`;
      
      openWhatsApp(message, true);
      
      toast({
        title: "WhatsApp aberto",
        description: "Tentando abrir WhatsApp nativo, fallback para Web se necessário",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error sharing to WhatsApp:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erro ao compartilhar no WhatsApp",
        duration: 3000,
      });
    }
  };

  const handleCopyFileToClipboard = async () => {
    const fileUrl = await getFileUrl();
    if (!fileUrl) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Não foi possível obter o link do arquivo",
        duration: 3000,
      });
      return;
    }

    setCopyingFile(true);

    try {
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }
      
      const blob = await response.blob();
      
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });

      await navigator.clipboard.write([clipboardItem]);
      
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);
      
      toast({
        title: "Arquivo copiado",
        description: "Arquivo PDF copiado para a área de transferência",
        duration: 3000,
      });
    } catch (error) {
      console.error('Error copying file to clipboard:', error);
      
      try {
        const shortUrl = await shortenUrl(fileUrl);
        await navigator.clipboard.writeText(shortUrl);
        
        toast({
          title: "Link copiado",
          description: "Não foi possível copiar o arquivo. Link copiado como alternativa.",
          duration: 3000,
        });
      } catch (fallbackError) {
        toast({
          variant: "destructive",
          title: t('error'),
          description: "Erro ao copiar arquivo para a área de transferência",
          duration: 3000,
        });
      }
    } finally {
      setCopyingFile(false);
    }
  };

  const handleGeneratePublicLink = async () => {
    if (!record?.pdfPath) {
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Arquivo não encontrado no armazenamento",
        duration: 3000,
      });
      return;
    }

    setIsGeneratingLink(true);
    
    try {
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(record.pdfPath, 7200); // 2 hours expiration
        
      if (error || !data?.signedUrl) {
        throw new Error('Failed to generate public link');
      }
      
      const shortUrl = await shortenUrl(data.signedUrl);
      await navigator.clipboard.writeText(shortUrl);
      
      toast({
        title: "Link público gerado",
        description: "Link encurtado temporário (2h) copiado para área de transferência",
        duration: 5000,
      });
      
    } catch (error) {
      console.error('Error generating public link:', error);
      toast({
        variant: "destructive",
        title: t('error'),
        description: "Erro ao gerar link público",
        duration: 3000,
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  return {
    handleWhatsAppShare,
    handleCopyFileToClipboard,
    handleGeneratePublicLink,
    isGeneratingLink,
    copiedToClipboard,
    copyingFile,
    isShortening,
  };
}
