
import React from 'react';
import { Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublicLinkButtonProps {
  onGenerate: () => void;
  isLoading: boolean;
}

export function PublicLinkButton({ onGenerate, isLoading }: PublicLinkButtonProps) {
  return (
    <Button
      variant="outline"
      className="w-full justify-start gap-3"
      onClick={onGenerate}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Link className="h-4 w-4" />
      )}
      Gerar link público seguro
    </Button>
  );
}
