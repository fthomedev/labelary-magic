
import React from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';
import { ConversionStage } from '@/hooks/conversion/useConversionState';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  isProcessingComplete?: boolean;
  onDownload?: () => void;
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
  currentLabel = 0,
  totalLabels = 0,
  stage = 'converting'
}: ConversionProgressProps) => {
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
        />
      </div>
    </div>
  );
}
