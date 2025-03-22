
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Play, Loader2, Download } from 'lucide-react';

interface ProcessButtonProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
}

export const ProcessButton: React.FC<ProcessButtonProps> = ({ 
  isConverting, 
  progress, 
  onConvert 
}) => {
  const { t } = useTranslation();

  return (
    <Button
      size="lg"
      onClick={onConvert}
      disabled={isConverting}
      className={`transition-all duration-200 active:scale-95 ${
        isConverting 
          ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
          : progress === 0
          ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600'
          : 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600'
      }`}
    >
      {isConverting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('converting')}
        </>
      ) : progress === 0 ? (
        <>
          <Play className="mr-2 h-4 w-4" />
          {t('process')}
        </>
      ) : (
        <>
          <Download className="mr-2 h-4 w-4" />
          {t('downloadComplete')}
        </>
      )}
    </Button>
  );
};
