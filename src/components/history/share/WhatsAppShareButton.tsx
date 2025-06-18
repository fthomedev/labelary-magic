
import React from 'react';
import { MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface WhatsAppShareButtonProps {
  onShare: () => void;
  isLoading: boolean;
}

export function WhatsAppShareButton({ onShare, isLoading }: WhatsAppShareButtonProps) {
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
      Compartilhar no WhatsApp
    </Button>
  );
}
