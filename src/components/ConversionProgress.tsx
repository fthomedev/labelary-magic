
import React from 'react';
import { ProgressBar } from './progress/ProgressBar';
import { ConvertButton } from './progress/ConvertButton';
import { Checkbox } from '@/components/ui/checkbox';

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
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <Checkbox
          id="turbo-mode"
          checked={turboEnabled}
          onCheckedChange={onToggleTurbo}
          disabled={isConverting}
          aria-label="Ativar modo turbo"
          title="Modo Turbo (mais rápido)"
          className="h-5 w-5 border-2 border-gray-400 bg-background data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground hover:border-primary transition-colors"
        />
        <label 
          htmlFor="turbo-mode" 
          className="text-sm font-medium text-foreground cursor-pointer select-none whitespace-nowrap hover:text-primary transition-colors"
        >
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

