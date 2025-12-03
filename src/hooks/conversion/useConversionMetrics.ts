
export const useConversionMetrics = () => {
  const logPerformanceMetrics = (
    totalTime: number,
    conversionPhaseTime: number,
    mergeTime: number,
    uploadTime: number,
    finalLabelCount: number,
    upscaleTime?: number
  ) => {
    console.log(`🏁 Total conversion process completed in ${totalTime}ms`);
    console.log(`📊 Performance breakdown:`, {
      totalTimeMs: totalTime,
      conversionTimeMs: conversionPhaseTime,
      upscaleTimeMs: upscaleTime || 0,
      mergeTimeMs: mergeTime,
      uploadTimeMs: uploadTime,
      labelsProcessed: finalLabelCount,
      averageTimePerLabel: finalLabelCount > 0 ? totalTime / finalLabelCount : 0,
      labelsPerSecond: finalLabelCount > 0 ? (finalLabelCount / (totalTime / 1000)).toFixed(2) : 0,
    });
  };

  return {
    logPerformanceMetrics
  };
};
