
import React from 'react';
import { Share2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { useShareActions } from '@/hooks/sharing/useShareActions';
import { WhatsAppShareButton } from './share/WhatsAppShareButton';
import { PublicLinkButton } from './share/PublicLinkButton';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ProcessingRecord | null;
}

export function ShareModal({ isOpen, onClose, record }: ShareModalProps) {
  const {
    handleWhatsAppShare,
    handleGeneratePublicLink,
    isGeneratingLink,
    isShortening,
  } = useShareActions(record, onClose);

  if (!record) return null;

  const labelText = record.labelCount === 1 ? 'etiqueta' : 'etiquetas';

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
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              📋 Arquivo: {record.labelCount} {labelText} ZPL
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              Convertido em {new Date(record.date).toLocaleDateString('pt-BR')}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            Escolha como deseja compartilhar o arquivo de forma segura:
          </p>
          
          <div className="space-y-2">
            <WhatsAppShareButton
              onShare={handleWhatsAppShare}
              isLoading={isShortening}
            />
            
            <PublicLinkButton
              onGenerate={handleGeneratePublicLink}
              isLoading={isGeneratingLink || isShortening}
            />
          </div>
          
          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              🔒 Links são gerados com tokens seguros, encurtados automaticamente e <strong>expiram em 24 horas</strong> por motivos de segurança.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
