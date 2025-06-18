import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { useUrlShortener } from './useUrlShortener';
import { useWhatsAppDetection } from './useWhatsAppDetection';
import { useSecureFileAccess } from './useSecureFileAccess';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export const useShareActions = (record: ProcessingRecord | null, onClose?: () => void) => {
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const { t } = useTranslation();
  const { toast } = useToast();
  const { shortenUrl, isShortening } = useUrlShortener();
  const { openWhatsApp } = useWhatsAppDetection();
  const { createSecureToken, getSecureFileUrl } = useSecureFileAccess();
  const navigate = useNavigate();

  const generateSecureUrl = async (): Promise<string | null> => {
    console.log('🚀 [DEBUG] ========== STARTING SECURE URL GENERATION ==========');
    console.log('🚀 [DEBUG] Record provided:', !!record);
    
    if (!record) {
      console.error('🚀 [ERROR] No record provided');
      toast({
        variant: "destructive",
        title: t('error'),
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
        title: t('error'),
        description: t('errorGeneratingLink'),
      });
      return null;
    }

    try {
      console.log('🚀 [DEBUG] About to create secure token for path:', record.pdfPath);
      
      // Create a secure token for the file
      const token = await createSecureToken(record.pdfPath, 24); // 24 hours expiration
      
      console.log('🚀 [DEBUG] Token creation result:', token);
      console.log('🚀 [DEBUG] Token type:', typeof token);
      console.log('🚀 [DEBUG] Token truthy:', !!token);
      
      if (!token) {
        console.error('🚀 [ERROR] Failed to create secure token - token is null or undefined');
        console.error('🚀 [ERROR] Token value:', token);
        throw new Error('Failed to create secure token - received null/undefined');
      }

      console.log('🚀 [SUCCESS] Token created successfully, generating URL...');
      
      // Generate the secure URL
      const secureUrl = getSecureFileUrl(token);
      console.log('🚀 [SUCCESS] Secure URL created:', secureUrl);
      
      return secureUrl;
    } catch (error) {
      console.error('🚀 [ERROR] ========== ERROR IN SECURE URL GENERATION ==========');
      console.error('🚀 [ERROR] Error creating secure file URL:', error);
      console.error('🚀 [ERROR] Error type:', typeof error);
      console.error('🚀 [ERROR] Error constructor:', error?.constructor?.name);
      console.error('🚀 [ERROR] Error message:', error?.message);
      console.error('🚀 [ERROR] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('🚀 [ERROR] Error stringified:', JSON.stringify(error, null, 2));
      console.error('🚀 [ERROR] ================================================');
      
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorGeneratingPublicLink', { error: error?.message || 'Erro desconhecido' }),
      });
      return null;
    }
  };

  const createShareMessage = (shortUrl: string) => {
    const labelText = record?.labelCount === 1 ? t('label') : t('labels');
    return t('whatsAppMessage', { 
      count: record?.labelCount, 
      labelText, 
      url: shortUrl 
    });
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
    
    const message = createShareMessage(shortUrl);
    openWhatsApp(message);
    
    toast({
      title: t('whatsAppOpened'),
      description: t('whatsAppOpenedDesc'),
    });

    // Close modal and navigate to app
    if (onClose) {
      onClose();
    }
    navigate('/app');
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
      
      const labelText = record?.labelCount === 1 ? t('label') : t('labels');
      
      toast({
        title: t('linkCopied'),
        description: t('linkCopiedDesc', { count: record?.labelCount, labelText }),
      });

      // Close modal and navigate to app
      if (onClose) {
        onClose();
      }
      navigate('/app');
    } catch (error) {
      console.error('🔗 [ERROR] Error generating secure public link:', error);
      console.error('🔗 [ERROR] Error details:', JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: t('error'),
        description: t('errorGeneratingPublicLink', { error: error?.message || 'Erro desconhecido' }),
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
