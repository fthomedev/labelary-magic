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
          size={isMobile ? "mobile" : "default"}
          onClick={onClick}
          variant="outline"
          className={`${isMobile ? 'w-full' : 'min-w-[160px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect border-primary text-primary hover:bg-primary/5`}
          aria-label={t('downloadAgain')}
        >
          <Download className="mr-2 h-4 w-4" />
          {t('downloadAgain')}
        </Button>
        
        <Button
          size={isMobile ? "mobile" : "default"}
          onClick={onProcessAgain}
          variant="outline"
          className={`${isMobile ? 'w-full' : 'min-w-[160px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect border-primary text-primary hover:bg-primary/5`}
          aria-label={t('processAgain')}
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          {t('processAgain')}
        </Button>
      </div>
    );
  }
  
  return (
    <Button
      size={isMobile ? "mobile" : "default"}
      onClick={onClick}
      disabled={isConverting}
      variant={isProcessingComplete ? "outline" : "default"}
      className={`${isMobile ? 'w-full' : 'min-w-[180px]'} text-sm font-medium transition-all duration-300 shadow hover:shadow-hover btn-effect ${
        isProcessingComplete ? 'border-primary text-primary hover:bg-primary/5' : ''
      }`}
      aria-label={isConverting ? t('converting') : isProcessingComplete ? t('downloadAgain') : t('process')}
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
