
import { useState } from 'react';

export const useConversionState = () => {
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isProcessingComplete, setIsProcessingComplete] = useState(false);
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

  const resetProcessingStatus = () => {
    setIsProcessingComplete(false);
    setProgress(0);
  };

  const startConversion = () => {
    setIsConverting(true);
    setProgress(0);
    setIsProcessingComplete(false);
  };

  const finishConversion = () => {
    setIsConverting(false);
    setProgress(100);
    setIsProcessingComplete(true);
  };

  const triggerHistoryRefresh = () => {
    setHistoryRefreshTrigger(prev => prev + 1);
  };

  return {
    isConverting,
    setIsConverting,
    progress,
    setProgress,
    isProcessingComplete,
    setIsProcessingComplete,
    historyRefreshTrigger,
    resetProcessingStatus,
    startConversion,
    finishConversion,
    triggerHistoryRefresh
  };
};
