import { useState, useEffect, useCallback } from 'react';
import {
  LabelSize,
  DEFAULT_LABEL_SIZE,
  LABEL_SIZE_STORAGE_KEY,
  isValidLabelSize,
} from '@/types/labelSize';

function readStoredLabelSize(): LabelSize {
  if (typeof window === 'undefined') return DEFAULT_LABEL_SIZE;
  try {
    const raw = window.localStorage.getItem(LABEL_SIZE_STORAGE_KEY);
    if (!raw) return DEFAULT_LABEL_SIZE;
    const parsed = JSON.parse(raw) as LabelSize;
    if (isValidLabelSize(parsed)) return parsed;
  } catch {
    // ignore
  }
  return DEFAULT_LABEL_SIZE;
}

export function useLabelSize() {
  const [labelSize, setLabelSizeState] = useState<LabelSize>(() => readStoredLabelSize());

  useEffect(() => {
    try {
      window.localStorage.setItem(LABEL_SIZE_STORAGE_KEY, JSON.stringify(labelSize));
    } catch {
      // ignore quota/private mode errors
    }
  }, [labelSize]);

  const setLabelSize = useCallback((next: LabelSize) => {
    if (isValidLabelSize(next)) {
      setLabelSizeState({ widthCm: next.widthCm, heightCm: next.heightCm });
    }
  }, []);

  return { labelSize, setLabelSize };
}
