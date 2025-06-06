import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Download, Loader2, Play, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ConvertButtonProps {
  isConverting: boolean;
  isProcessingComplete: boolean;
  onClick: () => void;
  onProcessAgain?: () => void;
}

export function ConvertButton({ 
  isConverting, 
  isProcessingComplete, 
  onClick,
  onProcessAgain
}: ConvertButtonProps) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  
  // Show two buttons when processing is complete
  if (isProcessingComplete && onProcessAgain) {
    return (
      <div className={`flex ${isMobile ? 'flex-col' : 'flex-row'} gap-3 ${isMobile ? 'w-full' : ''}`}>
        <Button
          size={isMobile ? "sm" : "default"}
          onClick={onClick}
          className={`${isMobile ? 'w-full' : 'min-w-[160px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect bg-white border border-green-500 text-green-600 hover:bg-green-50`}
        >
          <Download className="mr-2 h-4 w-4" />
          {t('downloadAgain')}
        </Button>
        
        <Button
          size={isMobile ? "sm" : "default"}
          onClick={onProcessAgain}
          className={`${isMobile ? 'w-full' : 'min-w-[160px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect bg-white border border-green-500 text-green-600 hover:bg-green-50`}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('processAgain')}
        </Button>
      </div>
    );
  }
  
  return (
    <Button
      size={isMobile ? "sm" : "default"}
      onClick={onClick}
      disabled={isConverting}
      className={`${isMobile ? 'w-full' : 'min-w-[180px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect ${
        isConverting 
          ? 'bg-gray-100 text-gray-500 dark:bg-gray-700'
          : isProcessingComplete
            ? 'bg-white border border-green-500 text-green-600 hover:bg-green-50'
            : 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600'
      }`}
    >
      {isConverting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t('converting')}
        </>
      ) : isProcessingComplete ? (
        <>
          <Download className="mr-2 h-4 w-4" />
          {t('downloadAgain')}
        </>
      ) : (
        <>
          <Play className="mr-2 h-4 w-4" />
          {t('process')}
        </>
      )}
    </Button>
  );
}
