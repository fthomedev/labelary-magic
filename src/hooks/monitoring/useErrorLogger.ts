import { useCallback } from 'react';
import {
  logProcessingError,
  reportProcessingError,
  ProcessingErrorPayload,
} from '@/lib/errorLogging';

/**
 * React-friendly wrapper around the centralized processing error logger.
 */
export const useErrorLogger = () => {
  const logError = useCallback(
    (payload: ProcessingErrorPayload) => logProcessingError(payload),
    []
  );

  const reportError = useCallback(
    (payload: ProcessingErrorPayload) => reportProcessingError(payload),
    []
  );

  return { logError, reportError };
};
