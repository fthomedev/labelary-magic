
import React from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const {
    handleWhatsAppShare,
    handleGeneratePublicLink,
    isGeneratingLink,
    isShortening,
  } = useShareActions(record, onClose);

  if (!record) return null;

  const labelText = record.labelCount === 1 ? t('label') : t('labels');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            {t('shareTitle')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-3 py-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              {t('fileInfo', { count: record.labelCount, labelText })}
            </p>
            <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {t('convertedOn', { date: new Date(record.date).toLocaleDateString() })}
            </p>
          </div>
          
          <p className="text-sm text-muted-foreground">
            {t('shareDescription')}
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
            <p 
              className="text-xs text-muted-foreground"
              dangerouslySetInnerHTML={{ __html: t('securityNotice') }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
