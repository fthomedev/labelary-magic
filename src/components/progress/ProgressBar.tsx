
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { ConversionStage } from '@/hooks/conversion/useConversionState';

interface ProgressBarProps {
  isConverting: boolean;
  progress: number;
  currentLabel?: number;
  totalLabels?: number;
  stage?: ConversionStage;
}

export function ProgressBar({ 
  isConverting, 
  progress, 
  currentLabel = 0, 
  totalLabels = 0,
  stage = 'converting'
}: ProgressBarProps) {
  const { t } = useTranslation();
  
  if (!isConverting) {
    return null;
  }

  const getStageMessage = (): string => {
    switch (stage) {
      case 'parsing':
        return t('progressParsing');
      case 'converting':
        if (totalLabels > 0 && currentLabel > 0) {
          return t('progressConverting', { current: currentLabel, total: totalLabels });
        }
        return t('progressConvertingSimple');
      case 'upscaling':
        if (totalLabels > 0 && currentLabel > 0) {
          return t('progressUpscaling', { current: currentLabel, total: totalLabels });
        }
        return t('progressUpscalingSimple');
      case 'organizing':
        return t('progressOrganizing');
      case 'uploading':
        return t('progressUploading');
      case 'complete':
        return t('progressComplete');
      default:
        return `${t('processing')} ${Math.round(progress)}%`;
    }
  };
  
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-full bg-secondary">
        <Progress 
          value={progress} 
          className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300" 
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {getStageMessage()}
      </p>
    </div>
  );
}
