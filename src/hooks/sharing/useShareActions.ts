
import { useState } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { useUrlShortener } from './useUrlShortener';
import { useWhatsAppDetection } from './useWhatsAppDetection';
import { useSecureFileAccess } from './useSecureFileAccess';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export const useShareActions = (record: ProcessingRecord | null) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { toast } = useToast();
  const { shortenUrl, isShortening } = useUrlShortener();
  const { openWhatsApp } = useWhatsAppDetection();
  const { createSecureToken, getSecureFileUrl } = useSecureFileAccess();

  const getSecureFileUrl = async (): Promise<string | null> => {
    if (!record || !record.pdfPath) {
      console.error('No valid PDF path available for secure sharing');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar link seguro - arquivo não encontrado",
      });
      return null;
    }

    try {
      console.log('Creating secure token for file:', record.pdfPath);
      
      // Create a secure token for the file
      const token = await createSecureToken(record.pdfPath, 24); // 24 hours expiration
      
      if (!token) {
        throw new Error('Failed to create secure token');
      }

      // Generate the secure URL
      const secureUrl = getSecureFileUrl(token);
      console.log('Secure URL created:', secureUrl);
      
      return secureUrl;
    } catch (error) {
      console.error('Error creating secure file URL:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar link seguro",
      });
      return null;
    }
  };

  const handleWhatsAppShare = async () => {
    const secureUrl = await getSecureFileUrl();
    if (!secureUrl) return;
    
    console.log('Shortening secure URL for WhatsApp...');
    const shortUrl = await shortenUrl(secureUrl);
    console.log('Final shortened URL for WhatsApp:', shortUrl);
    
    const message = `Confira este arquivo PDF: ${shortUrl}`;
    openWhatsApp(message);
    
    toast({
      title: "Compartilhamento iniciado",
      description: "Abrindo WhatsApp com link seguro...",
    });
  };

  const handleGeneratePublicLink = async () => {
    setIsGeneratingLink(true);
    
    try {
      const secureUrl = await getSecureFileUrl();
      if (!secureUrl) return;
      
      console.log('Shortening secure URL for public link...');
      const shortUrl = await shortenUrl(secureUrl);
      console.log('Final shortened secure URL:', shortUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shortUrl);
      
      toast({
        title: "Link seguro copiado!",
        description: `Link encurtado e seguro copiado (${shortUrl.length} caracteres)`,
      });
    } catch (error) {
      console.error('Error generating secure public link:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o link público seguro",
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
