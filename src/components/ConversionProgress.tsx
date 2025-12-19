
import React from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';
import { ConversionStage } from '@/hooks/conversion/useConversionState';
import { DonationButton } from './DonationButton';
import { useTranslation } from 'react-i18next';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  isProcessingComplete?: boolean;
  onDownload?: () => void;
  onNewProcess?: () => void;
  currentLabel?: number;
  totalLabels?: number;
  stage?: ConversionStage;
}

export const ConversionProgress = ({ 
  isConverting, 
  progress, 
  onConvert,
  isProcessingComplete = false,
  onDownload,
  onNewProcess,
  currentLabel = 0,
  totalLabels = 0,
  stage = 'converting'
}: ConversionProgressProps) => {
  const { t } = useTranslation();
  
  const handleButtonClick = () => {
    if (isProcessingComplete && onDownload) {
      onDownload();
    } else {
      onConvert();
    }
  };

  const handleProcessAgain = () => {
    onConvert();
  };
  
  return (
    <div className="space-y-4">
      <ProgressBar 
        isConverting={isConverting} 
        progress={progress}
        currentLabel={currentLabel}
        totalLabels={totalLabels}
        stage={stage}
      />
      
      <div className="flex justify-center">
        <ConvertButton 
          isConverting={isConverting}
          isProcessingComplete={isProcessingComplete}
          onClick={handleButtonClick}
          onProcessAgain={isProcessingComplete ? handleProcessAgain : undefined}
          onNewProcess={isProcessingComplete ? onNewProcess : undefined}
        />
      </div>

      {isProcessingComplete && (
        <div className="pt-4 border-t border-border/50">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">{t('likedIt')}</p>
            <DonationButton variant="success" />
          </div>
        </div>
      )}
    </div>
  );
}
