
import React from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  isProcessingComplete?: boolean;
  onDownload?: () => void;
}

export const ConversionProgress = ({ 
  isConverting, 
  progress, 
  onConvert,
  isProcessingComplete = false,
  onDownload
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
