import React, { useState, useEffect } from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';
import { ConversionStage, ConversionMode } from '@/hooks/conversion/useConversionState';
import { DonationCTA } from './donation/DonationCTA';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  isProcessingComplete?: boolean;
  onDownload?: () => void;
  onNewProcess?: () => void;
  onPrint?: () => void;
  currentLabel?: number;
  totalLabels?: number;
  stage?: ConversionStage;
  conversionMode?: ConversionMode;
}

export const ConversionProgress = ({ 
  isConverting, 
  progress, 
  onConvert,
  isProcessingComplete = false,
  onDownload,
  onNewProcess,
  onPrint,
  currentLabel = 0,
  totalLabels = 0,
  stage = 'converting',
  conversionMode = 'standard'
}: ConversionProgressProps) => {
  // Preserve the label count when conversion completes
  const [completedLabelsCount, setCompletedLabelsCount] = useState(0);

  useEffect(() => {
    if (isProcessingComplete && totalLabels > 0) {
      setCompletedLabelsCount(totalLabels);
    }
  }, [isProcessingComplete, totalLabels]);

  // Reset when starting a new conversion
  useEffect(() => {
    if (isConverting && stage === 'parsing') {
      setCompletedLabelsCount(0);
    }
  }, [isConverting, stage]);
  
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
        conversionMode={conversionMode}
      />
      
      <div className="flex justify-center">
        <ConvertButton 
          isConverting={isConverting}
          isProcessingComplete={isProcessingComplete}
          onClick={handleButtonClick}
          onProcessAgain={isProcessingComplete ? handleProcessAgain : undefined}
          onNewProcess={isProcessingComplete ? onNewProcess : undefined}
          onPrint={isProcessingComplete ? onPrint : undefined}
        />
      </div>

      {isProcessingComplete && (
        <div className="pt-4">
          <DonationCTA labelsProcessed={completedLabelsCount || totalLabels} />
        </div>
      )}
    </div>
  );
}
