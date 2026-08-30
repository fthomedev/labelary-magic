import { useCallback, useEffect, useState } from 'react';

/**
 * Controls how often the "rate this conversion" prompt is shown.
 * Rules:
 *  - at most once per day
 *  - at least 3 conversions since the last prompt
 * State lives in localStorage so it survives reloads.
 */
const LAST_SHOWN_KEY = 'zpl-rating-last-shown';
const COUNTER_KEY = 'zpl-rating-conversions-since';
const MIN_CONVERSIONS = 3;

const todayKey = () => new Date().toISOString().slice(0, 10);

const readCounter = (): number => {
  const raw = localStorage.getItem(COUNTER_KEY);
  const parsed = raw ? parseInt(raw, 10) : 0;
  return Number.isFinite(parsed) ? parsed : 0;
};

export const useRatingPrompt = () => {
  const [shouldPrompt, setShouldPrompt] = useState(false);

  /** Called once every time a conversion completes successfully. */
  const registerConversion = useCallback(() => {
    try {
      const next = readCounter() + 1;
      localStorage.setItem(COUNTER_KEY, String(next));

      const alreadyShownToday = localStorage.getItem(LAST_SHOWN_KEY) === todayKey();
      if (!alreadyShownToday && next >= MIN_CONVERSIONS) {
        localStorage.setItem(LAST_SHOWN_KEY, todayKey());
        localStorage.setItem(COUNTER_KEY, '0');
        setShouldPrompt(true);
      } else {
        setShouldPrompt(false);
      }
    } catch {
      setShouldPrompt(false);
    }
  }, []);

  const dismissPrompt = useCallback(() => setShouldPrompt(false), []);

  return { shouldPrompt, registerConversion, dismissPrompt };
};

export const useRatingPromptReset = (deps: unknown[]) => {
  // helper kept intentionally simple; consumers reset via dismissPrompt
  useEffect(() => {}, deps);
};
