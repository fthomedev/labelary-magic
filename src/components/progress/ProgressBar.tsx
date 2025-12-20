
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { ConversionStage } from '@/hooks/conversion/useConversionState';

interface ProgressBarProps {
  isConverting: boolean;
  progress: number;
  currentLabel?: number;
  totalLabels?: number;
  stage?: ConversionStage;
  startTime?: number;
}

export function ProgressBar({ 
  isConverting, 
  progress, 
  currentLabel = 0, 
  totalLabels = 0,
  stage = 'converting',
  startTime
}: ProgressBarProps) {
  const { t } = useTranslation();
  
  // Show component during conversion OR when in finalizing/complete stage
  const shouldShow = isConverting || stage === 'finalizing' || stage === 'complete';
  
  // Calculate ETA based on elapsed time and progress
  const etaDisplay = useMemo(() => {
    if (!startTime || progress <= 5 || progress >= 95 || stage === 'complete') {
      return null;
    }
    
    const elapsed = Date.now() - startTime;
    const estimatedTotal = (elapsed / progress) * 100;
    const remaining = Math.max(0, estimatedTotal - elapsed);
    const remainingSeconds = Math.ceil(remaining / 1000);
    
    if (remainingSeconds < 5) {
      return t('etaFinalizing', 'Finalizando...');
    }
    
    if (remainingSeconds < 60) {
      return t('etaSeconds', { seconds: remainingSeconds });
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return t('etaMinutes', { minutes, seconds });
  }, [startTime, progress, stage, t]);
  
  if (!shouldShow) {
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
      case 'finalizing':
        return t('progressFinalizing', 'Finalizando...');
      case 'complete':
        return t('progressComplete');
      default:
        return `${t('processing')} ${Math.round(progress)}%`;
    }
  };
  
  return (
    <div className="space-y-3 transition-opacity duration-300">
      <div className="overflow-hidden rounded-full bg-secondary">
        <Progress 
          value={progress} 
          className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300" 
        />
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground">
        <span>{getStageMessage()}</span>
        {etaDisplay && <span className="text-primary/70">{etaDisplay}</span>}
      </div>
    </div>
  );
}
