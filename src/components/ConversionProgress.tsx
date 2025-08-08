
import React from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';
import { Switch } from '@/components/ui/switch';

interface ConversionProgressProps {
  isConverting: boolean;
  progress: number;
  onConvert: () => void;
  isProcessingComplete?: boolean;
  onDownload?: () => void;
  turboEnabled?: boolean;
  onToggleTurbo?: (value: boolean) => void;
}

export const ConversionProgress = ({ 
  isConverting, 
  progress, 
  onConvert,
  isProcessingComplete = false,
  onDownload,
  turboEnabled = false,
  onToggleTurbo
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

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Switch id="turbo-mode" checked={turboEnabled} onCheckedChange={onToggleTurbo} disabled={isConverting} />
          <label htmlFor="turbo-mode" className="text-sm text-gray-700 dark:text-gray-200 select-none">
            Modo Turbo (mais rápido)
          </label>
        </div>
        <div>
          <ConvertButton 
            isConverting={isConverting}
            isProcessingComplete={isProcessingComplete}
            onClick={handleButtonClick}
            onProcessAgain={isProcessingComplete ? handleProcessAgain : undefined}
          />
        </div>
      </div>
    </div>
  );
}

