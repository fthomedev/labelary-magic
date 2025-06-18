
import React from 'react';
import { Copy, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CopyFileButtonProps {
  onCopy: () => void;
  isLoading: boolean;
  isCopied: boolean;
}

export function CopyFileButton({ onCopy, isLoading, isCopied }: CopyFileButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3"
      onClick={onCopy}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isCopied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      Copiar arquivo PDF
    </Button>
  );
}
