
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PublicLinkButtonProps {
  onGenerate: () => void;
  isLoading: boolean;
}

export function PublicLinkButton({ onGenerate, isLoading }: PublicLinkButtonProps) {
  const { t } = useTranslation();
  
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
      {t('generatePublicLink')}
    </Button>
  );
}
