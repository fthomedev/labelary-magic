
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { ConversionStage, ConversionMode } from '@/hooks/conversion/useConversionState';
import { RotatingMetricBadge } from '@/components/donation/RotatingMetricBadge';
import { useProjectMetrics } from '@/hooks/useProjectMetrics';

// Tempo médio por etiqueta em segundos (benchmarked)
const TIME_PER_LABEL = {
  hd: 0.93294749845583693638,
  standard: 0.19007126667409801954
} as const;

interface ProgressBarProps {
  isConverting: boolean;
  progress: number;
  currentLabel?: number;
  totalLabels?: number;
  stage?: ConversionStage;
  conversionMode?: ConversionMode;
}

export function ProgressBar({ 
  isConverting, 
  progress, 
  currentLabel = 0, 
  totalLabels = 0,
  stage = 'converting',
  conversionMode = 'standard'
}: ProgressBarProps) {
  const { t } = useTranslation();
  const metrics = useProjectMetrics();
  
  // Show component during conversion OR when in finalizing/complete stage
  const shouldShow = isConverting || stage === 'finalizing' || stage === 'complete';
  
  // Calculate predictive ETA based on remaining labels and known time per label
  const etaDisplay = useMemo(() => {
    // Don't show ETA when complete, idle, or no labels info
    if (!totalLabels || stage === 'complete' || stage === 'idle') {
      return null;
    }
    
    // Get time per label based on conversion mode
    const timePerLabel = conversionMode === 'hd' 
      ? TIME_PER_LABEL.hd 
      : TIME_PER_LABEL.standard;
    
    // Calculate remaining labels
    const remainingLabels = Math.max(0, totalLabels - currentLabel);
    
    // Calculate remaining time in seconds
    const remainingSeconds = Math.ceil(remainingLabels * timePerLabel);
    
    if (remainingSeconds < 3) {
      return t('etaFinalizing', 'Finalizando...');
    }
    
    if (remainingSeconds < 60) {
      return t('etaSeconds', { seconds: remainingSeconds });
    }
    
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return t('etaMinutes', { minutes, seconds });
  }, [totalLabels, currentLabel, stage, conversionMode, t]);
  
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
  // Show metric badge during active conversion (including finalizing/organizing stages)
  const showMetricBadge = (isConverting || stage === 'organizing' || stage === 'uploading') && stage !== 'complete' && stage !== 'idle';
  
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
      
      {/* Subtle rotating metric during conversion */}
      {showMetricBadge && (
        <div className="flex justify-center pt-1">
          <RotatingMetricBadge
            totalLabels={metrics.totalLabels}
            labelsToday={metrics.labelsToday}
            conversionsToday={metrics.conversionsToday}
            totalDonations={metrics.totalDonations}
            uniqueUsers={metrics.uniqueUsers}
            compact
          />
        </div>
      )}
    </div>
  );
}
