
import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppShareButtonProps {
  onShare: () => void;
  isLoading: boolean;
}

export function WhatsAppShareButton({ onShare, isLoading }: WhatsAppShareButtonProps) {
  const { t } = useTranslation();
  
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3"
      onClick={onShare}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <MessageCircle className="h-4 w-4 text-green-600" />
      )}
      {t('shareViaWhatsApp')}
    </Button>
  );
}
