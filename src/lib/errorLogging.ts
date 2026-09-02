import { supabase } from '@/integrations/supabase/client';

/**
 * Centralized, fire-and-forget logging of label processing failures.
 *
 * Goal: collect enough METADATA to diagnose recurring failures without ever
 * storing customer ZPL content. Never throws and never blocks the conversion
 * pipeline — every failure to log is swallowed silently (console only).
 */

export type ProcessingErrorType =
  | 'labelary_batch_failed'
  | 'labelary_partial_failure'
  | 'labelary_all_batches_failed'
  | 'pdf_merge_failed'
  | 'storage_upload_failed'
  | 'hd_upscale_failed'
  | 'two_column_pairing_failed'
  | 'storage_delete_failed'
  | 'zpl_parse_empty'
  | 'unknown_fatal';

export type ProcessingKind = 'standard' | 'a4' | 'hd';

export interface ProcessingErrorPayload {
  errorType: ProcessingErrorType;
  error?: unknown;
  /** Overrides the message extracted from `error`. */
  message?: string;
  processingType?: ProcessingKind;
  labelCountAttempted?: number;
  failedCount?: number;
  processingTimeMs?: number;
  zplFormat?: 'tiktok' | 'shopee' | 'unknown';
  labelSize?: string;
  twoColumn?: boolean;
  hasImages?: boolean;
  batchSize?: number;
  httpStatus?: number;
  /** Extra, non-sensitive context. Never include ZPL content here. */
  metadata?: Record<string, unknown>;
}

const APP_VERSION = 'zpleasy-web';

const extractMessage = (error: unknown, fallback?: string): string => {
  if (fallback) return fallback.slice(0, 1000);
  if (error instanceof Error) return error.message.slice(0, 1000);
  if (typeof error === 'string') return error.slice(0, 1000);
  try {
    return JSON.stringify(error).slice(0, 1000);
  } catch {
    return 'Unknown error';
  }
};

const extractStack = (error: unknown): string | null => {
  if (error instanceof Error && error.stack) return error.stack.slice(0, 4000);
  return null;
};

/**
 * Extract an HTTP status code from a message like "HTTP error! status: 400".
 */
export const extractHttpStatus = (error: unknown): number | undefined => {
  const msg = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const match = msg.match(/status:?\s*(\d{3})/i);
  return match ? parseInt(match[1], 10) : undefined;
};

export const logProcessingError = async (payload: ProcessingErrorPayload): Promise<void> => {
  try {
    const { data } = await supabase.auth.getUser();
    const user = data?.user;

    // The table requires an authenticated owner (RLS). Anonymous failures are
    // only reported to the console.
    if (!user) {
      console.warn('⚠️ [errorLog] skipped (no session):', payload.errorType, payload.message);
      return;
    }

    const row = {
      user_id: user.id,
      error_type: payload.errorType,
      error_message: extractMessage(payload.error, payload.message),
      error_stack: extractStack(payload.error),
      processing_type: payload.processingType ?? 'standard',
      label_count_attempted: payload.labelCountAttempted ?? null,
      failed_count: payload.failedCount ?? null,
      processing_time_ms: payload.processingTimeMs ?? null,
      zpl_format: payload.zplFormat ?? null,
      label_size: payload.labelSize ?? null,
      two_column: payload.twoColumn ?? null,
      has_images: payload.hasImages ?? null,
      batch_size: payload.batchSize ?? null,
      http_status: payload.httpStatus ?? extractHttpStatus(payload.error) ?? null,
      app_version: APP_VERSION,
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 500) : null,
      metadata: (payload.metadata ?? null) as never,
    };

    const { error } = await supabase.from('processing_errors').insert(row);
    if (error) {
      console.warn('⚠️ [errorLog] insert failed:', error.message);
    } else {
      console.log(`🧾 [errorLog] recorded "${payload.errorType}"`);
    }
  } catch (loggingError) {
    console.warn('⚠️ [errorLog] unexpected logging failure:', loggingError);
  }
};

/**
 * Fire-and-forget variant: never awaited by the caller, never rejects.
 */
export const reportProcessingError = (payload: ProcessingErrorPayload): void => {
  void logProcessingError(payload).catch(() => {
    /* already handled internally */
  });
};
