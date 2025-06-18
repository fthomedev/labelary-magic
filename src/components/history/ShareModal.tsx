import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Share2, MessageCircle, Copy, Link, Loader2, Check } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { supabase } from '@/integrations/supabase/client';
import { useUrlShortener } from '@/hooks/sharing/useUrlShortener';
import { useWhatsAppDetection } from '@/hooks/sharing/useWhatsAppDetection';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProcessingRecord | null;
}

export function ShareModal({ isOpen, onClose, record }: ShareModalProps) {
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
      // Encurtar a URL para compartilhamento mais amigável
      const shortUrl = await shortenUrl(fileUrl);
      const message = `Confira este PDF gerado pelo ZPL Easy: ${shortUrl}`;
      
      // Usar o hook de detecção do WhatsApp
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
      // Baixar o arquivo como blob
      const response = await fetch(fileUrl);
      if (!response.ok) {
        throw new Error('Failed to fetch PDF file');
      }
      
      const blob = await response.blob();
      
      // Criar um ClipboardItem com o arquivo PDF
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      });

      // Copiar para a área de transferência
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
      
      // Fallback: se não conseguir copiar o arquivo, copiar o link
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
      // Generate a signed URL with longer expiration for public sharing
      const { data, error } = await supabase.storage
        .from('pdfs')
        .createSignedUrl(record.pdfPath, 7200); // 2 hours expiration
        
      if (error || !data?.signedUrl) {
        throw new Error('Failed to generate public link');
      }
      
      // Encurtar a URL pública usando o serviço de encurtamento
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

  if (!record) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartilhar PDF
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <p className="text-sm text-muted-foreground">
            Escolha como deseja compartilhar o arquivo:
          </p>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleWhatsAppShare}
              disabled={isShortening}
            >
              {isShortening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 text-green-600" />
              )}
              Compartilhar no WhatsApp
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleCopyFileToClipboard}
              disabled={copyingFile}
            >
              {copyingFile ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : copiedToClipboard ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              Copiar arquivo PDF
            </Button>
            
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleGeneratePublicLink}
              disabled={isGeneratingLink || isShortening}
            >
              {isGeneratingLink || isShortening ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Link className="h-4 w-4" />
              )}
              Gerar link público encurtado
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              O arquivo PDF será copiado diretamente para sua área de transferência. 
              Links são encurtados automaticamente e expiram por motivos de segurança.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
