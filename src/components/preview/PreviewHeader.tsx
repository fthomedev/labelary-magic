
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Tag, CheckCircle } from 'lucide-react';

interface PreviewHeaderProps {
  isProcessingComplete: boolean;
  totalLabels: number;
}

export function PreviewHeader({ isProcessingComplete, totalLabels }: PreviewHeaderProps) {
  const { t } = useTranslation();
  
  return (
    <div className="flex items-center space-x-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
        {isProcessingComplete ? (
          <CheckCircle className="h-4 w-4 text-primary" />
        ) : (
          <Tag className="h-4 w-4 text-primary" />
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-foreground font-heading">
          {t('totalLabels')}
        </h3>
        <p className="text-xs text-muted-foreground">
          {isProcessingComplete ? t('labelsProcessed', { count: totalLabels }) : t('processing')}
        </p>
      </div>
    </div>
  );
}
