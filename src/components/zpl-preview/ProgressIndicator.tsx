
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface ProgressIndicatorProps {
  progress: number;
  isConverting: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({ 
  progress, 
  isConverting 
}) => {
  const { t } = useTranslation();

  if (!isConverting) return null;

  return (
    <div className="space-y-2 mt-4">
      <div className="overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
        <Progress value={progress} className="h-2 w-full bg-gradient-to-r from-cyan-500 to-blue-500" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
        {t('processing')} {Math.round(progress)}%
      </p>
    </div>
  );
};
