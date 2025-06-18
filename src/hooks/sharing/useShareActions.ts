
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

  const generateSecureUrl = async (): Promise<string | null> => {
    console.log('🚀 [DEBUG] Starting secure URL generation process...');
    console.log('🚀 [DEBUG] Record provided:', !!record);
    
    if (!record) {
      console.error('🚀 [ERROR] No record provided');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nenhum registro fornecido para compartilhamento",
      });
      return null;
    }

    console.log('🚀 [DEBUG] Record details:', {
      id: record.id,
      pdfPath: record.pdfPath,
      pdfUrl: record.pdfUrl,
      date: record.date,
      labelCount: record.labelCount
    });

    if (!record.pdfPath) {
      console.error('🚀 [ERROR] No valid PDF path available for secure sharing');
      console.error('🚀 [ERROR] Record pdfPath is:', record.pdfPath);
      console.error('🚀 [ERROR] Record pdfUrl is:', record.pdfUrl);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar link seguro - arquivo não encontrado",
      });
      return null;
    }

    try {
      console.log('🚀 [DEBUG] About to create secure token...');
      
      // Create a secure token for the file
      const token = await createSecureToken(record.pdfPath, 24); // 24 hours expiration
      
      console.log('🚀 [DEBUG] Token creation result:', token);
      
      if (!token) {
        console.error('🚀 [ERROR] Failed to create secure token - token is null or undefined');
        throw new Error('Failed to create secure token');
      }

      console.log('🚀 [SUCCESS] Token created successfully, generating URL...');
      
      // Generate the secure URL
      const secureUrl = getSecureFileUrl(token);
      console.log('🚀 [SUCCESS] Secure URL created:', secureUrl);
      
      return secureUrl;
    } catch (error) {
      console.error('🚀 [ERROR] Error creating secure file URL:', error);
      console.error('🚀 [ERROR] Error type:', typeof error);
      console.error('🚀 [ERROR] Error constructor:', error?.constructor?.name);
      console.error('🚀 [ERROR] Error message:', error?.message);
      console.error('🚀 [ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar link seguro",
      });
      return null;
    }
  };

  const handleWhatsAppShare = async () => {
    console.log('📱 [DEBUG] Starting WhatsApp share...');
    const secureUrl = await generateSecureUrl();
    if (!secureUrl) {
      console.error('📱 [ERROR] No secure URL generated for WhatsApp');
      return;
    }
    
    console.log('📱 [DEBUG] Shortening secure URL for WhatsApp...');
    const shortUrl = await shortenUrl(secureUrl);
    console.log('📱 [DEBUG] Final shortened URL for WhatsApp:', shortUrl);
    
    const message = `Confira este arquivo PDF: ${shortUrl}`;
    openWhatsApp(message);
    
    toast({
      title: "Compartilhamento iniciado",
      description: "Abrindo WhatsApp com link seguro...",
    });
  };

  const handleGeneratePublicLink = async () => {
    console.log('🔗 [DEBUG] Starting public link generation...');
    setIsGeneratingLink(true);
    
    try {
      const secureUrl = await generateSecureUrl();
      if (!secureUrl) {
        console.error('🔗 [ERROR] No secure URL generated for public link');
        return;
      }
      
      console.log('🔗 [DEBUG] Shortening secure URL for public link...');
      const shortUrl = await shortenUrl(secureUrl);
      console.log('🔗 [SUCCESS] Final shortened secure URL:', shortUrl);
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shortUrl);
      
      toast({
        title: "Link seguro copiado!",
        description: `Link encurtado e seguro copiado (${shortUrl.length} caracteres)`,
      });
    } catch (error) {
      console.error('🔗 [ERROR] Error generating secure public link:', error);
      console.error('🔗 [ERROR] Error details:', JSON.stringify(error, null, 2));
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
