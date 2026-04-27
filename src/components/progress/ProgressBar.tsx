
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';
import { ConversionStage, ConversionMode } from '@/hooks/conversion/useConversionState';

// Tempo médio por etiqueta em segundos (benchmarked end-to-end)
const TIME_PER_LABEL = {
  hd: 0.93294749845583693638,
  standard: 0.19007126667409801954
} as const;

// Mapeamento de etapas visíveis para o usuário (apenas modo HD).
// Standard tem efetivamente uma fase relevante, então não exibimos indicador.
const HD_STEP_MAP: Partial<Record<ConversionStage, [number, number]>> = {
  parsing: [1, 3],
  converting: [1, 3],
  upscaling: [2, 3],
  organizing: [3, 3],
  uploading: [3, 3],
  finalizing: [3, 3],
};

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
  
  // Show component during conversion OR when in finalizing/complete stage
  const shouldShow = isConverting || stage === 'finalizing' || stage === 'complete';
  
  // ETA contínuo baseado no progresso geral da barra (não em currentLabel),
  // evitando saltos quando o contador de etiquetas reinicia entre fases.
  const etaDisplay = useMemo(() => {
    if (!totalLabels || stage === 'complete' || stage === 'idle') {
      return null;
    }

    const timePerLabel = conversionMode === 'hd'
      ? TIME_PER_LABEL.hd
      : TIME_PER_LABEL.standard;

    const totalEstimatedSeconds = totalLabels * timePerLabel;
    const remainingFraction = Math.max(0, 1 - progress / 100);
    const remainingSeconds = Math.ceil(totalEstimatedSeconds * remainingFraction);

    if (remainingSeconds < 3) {
      return t('etaFinalizing', 'Finalizando...');
    }

    if (remainingSeconds < 60) {
      return t('etaSeconds', { seconds: remainingSeconds });
    }

    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return t('etaMinutes', { minutes, seconds });
  }, [totalLabels, progress, stage, conversionMode, t]);
  
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
        // Mensagem sem contador X/N para evitar a sensação de "reinício"
        // do contador que ocorre na transição converting -> upscaling.
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

  // Indicador "Etapa X de Y" apenas para HD, deixando claro que existem
  // múltiplas etapas e que a mudança de mensagem não é um reinício.
  const stepIndicator = useMemo(() => {
    if (conversionMode !== 'hd') return null;
    if (stage === 'complete' || stage === 'idle') return null;
    const step = HD_STEP_MAP[stage];
    if (!step) return null;
    return t('progressStepIndicator', { current: step[0], total: step[1] });
  }, [conversionMode, stage, t]);
  
  return (
    <div className="space-y-3 transition-opacity duration-300">
      <div className="overflow-hidden rounded-full bg-secondary">
        <Progress 
          value={progress} 
          className="h-2 w-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-300" 
        />
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground gap-2">
        <span className="truncate">
          {stepIndicator && (
            <span className="text-primary/80 font-medium mr-1.5">{stepIndicator} ·</span>
          )}
          {getStageMessage()}
        </span>
        {etaDisplay && <span className="text-primary/70 shrink-0">{etaDisplay}</span>}
      </div>
    </div>
  );
}
