
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  isConverting: boolean;
  progress: number;
}

export function ProgressBar({ isConverting, progress }: ProgressBarProps) {
  const { t } = useTranslation();
  
  if (!isConverting) {
    return null;
  }
  
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-full bg-secondary">
        <Progress 
          value={progress} 
          className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300" 
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t('processing')} {Math.round(progress)}%
      </p>
    </div>
  );
}
