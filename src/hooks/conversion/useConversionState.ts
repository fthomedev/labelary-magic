
import { useState } from 'react';

export type ConversionStage = 
  | 'idle'
  | 'parsing'
  | 'converting'
  | 'upscaling'
  | 'organizing'
  | 'uploading'
  | 'finalizing'
  | 'complete';

export type ConversionMode = 'standard' | 'hd';

export interface ProgressInfo {
  percentage: number;
  currentLabel: number;
  totalLabels: number;
  stage: ConversionStage;
  startTime?: number;
  conversionMode?: ConversionMode;
}

const initialProgressInfo: ProgressInfo = {
  percentage: 0,
  currentLabel: 0,
  totalLabels: 0,
  stage: 'idle',
  startTime: undefined
};

export const useConversionState = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo>(initialProgressInfo);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
    setProgressInfo(initialProgressInfo);
  };

  const startConversion = () => {
    setIsConverting(true);
    setProgress(0);
    setIsProcessingComplete(false);
    setProgressInfo({ ...initialProgressInfo, stage: 'parsing', startTime: Date.now() });
  };

  const finishConversion = () => {
    setIsConverting(false);
    setProgress(100);
    setIsProcessingComplete(true);
    setProgressInfo(prev => ({ ...prev, percentage: 100, stage: 'complete' }));
  };

  const updateProgress = (info: Partial<ProgressInfo>) => {
    setProgressInfo(prev => ({ ...prev, ...info }));
    if (info.percentage !== undefined) {
      setProgress(info.percentage);
    }
  };

  const triggerHistoryRefresh = () => {
    setHistoryRefreshTrigger(prev => prev + 1);
  };

  return {
    isConverting,
    setIsConverting,
    progress,
    setProgress,
    progressInfo,
    setProgressInfo,
    isProcessingComplete,
    setIsProcessingComplete,
    historyRefreshTrigger,
    resetProcessingStatus,
    startConversion,
    finishConversion,
    updateProgress,
    triggerHistoryRefresh
  };
};
