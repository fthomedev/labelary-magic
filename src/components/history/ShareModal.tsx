
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
  } = useShareActions(record);

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
              Links são encurtados automaticamente e expiram por motivos de segurança.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
