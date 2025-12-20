/**
 * Centralized progress calculator for both Standard and HD conversions.
 * Ensures consistent progress bar behavior across all conversion modes.
 */

export type ConversionMode = 'standard' | 'hd';
export type ProgressStage = 'parsing' | 'converting' | 'upscaling' | 'organizing' | 'uploading' | 'complete';

interface ProgressRange {
  start: number;
  end: number;
}

type ProgressRanges = Record<ProgressStage, ProgressRange>;

/**
 * Progress ranges for each conversion mode.
 * Each stage has a start and end percentage.
 * 
 * Standard: parsing (0-5) → converting (5-70) → organizing (70-80) → uploading (80-95) → complete (100)
 * HD: parsing (0-5) → converting (5-45) → upscaling (45-70) → organizing (70-80) → uploading (80-95) → complete (100)
 */
const PROGRESS_RANGES: Record<ConversionMode, ProgressRanges> = {
  standard: {
    parsing: { start: 0, end: 5 },
    converting: { start: 5, end: 70 },
    upscaling: { start: 70, end: 70 }, // Not used in standard, same as converting end
    organizing: { start: 70, end: 80 },
    uploading: { start: 80, end: 95 },
    complete: { start: 100, end: 100 }
  },
  hd: {
    parsing: { start: 0, end: 5 },
    converting: { start: 5, end: 45 },
    upscaling: { start: 45, end: 70 },
    organizing: { start: 70, end: 80 },
    uploading: { start: 80, end: 95 },
    complete: { start: 100, end: 100 }
  }
};

/**
 * Calculate overall progress percentage based on mode, stage, and stage progress.
 * 
 * @param mode - 'standard' or 'hd'
 * @param stage - Current stage of conversion
 * @param stageProgress - Progress within the current stage (0-100)
 * @returns Overall progress percentage (0-100)
 */
export const calculateProgress = (
  mode: ConversionMode,
  stage: ProgressStage,
  stageProgress: number = 100
): number => {
  const range = PROGRESS_RANGES[mode][stage];
  const clampedProgress = Math.max(0, Math.min(100, stageProgress));
  return range.start + (clampedProgress / 100) * (range.end - range.start);
};

/**
 * Get the start percentage for a given stage.
 */
export const getStageStart = (mode: ConversionMode, stage: ProgressStage): number => {
  return PROGRESS_RANGES[mode][stage].start;
};

/**
 * Get the end percentage for a given stage.
 */
export const getStageEnd = (mode: ConversionMode, stage: ProgressStage): number => {
  return PROGRESS_RANGES[mode][stage].end;
};

/**
 * Hook for using progress calculator in components.
 */
export const useProgressCalculator = () => {
  return {
    calculateProgress,
    getStageStart,
    getStageEnd,
    PROGRESS_RANGES
  };
};
