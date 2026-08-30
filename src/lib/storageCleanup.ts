import { supabase } from '@/integrations/supabase/client';
import { logProcessingError } from '@/lib/errorLogging';

/**
 * Chunked removal of Storage objects.
 *
 * The Storage API rejects (or times out on) very large `remove()` payloads, so
 * deletions are split into small chunks sent a few at a time. Failures are
 * reported back to the caller instead of being swallowed, so the UI can tell
 * the user the files will be swept by the automatic cleanup.
 */

const REMOVE_CHUNK = 100;
const REMOVE_CONCURRENCY = 5;

export interface StorageRemovalResult {
  attempted: number;
  removed: number;
  failed: number;
  errors: string[];
}

export const removeStoragePaths = async (
  bucket: string,
  paths: string[],
): Promise<StorageRemovalResult> => {
  const unique = Array.from(new Set(paths.filter((p): p is string => !!p)));
  const result: StorageRemovalResult = {
    attempted: unique.length,
    removed: 0,
    failed: 0,
    errors: [],
  };

  if (unique.length === 0) return result;

  const chunks: string[][] = [];
  for (let i = 0; i < unique.length; i += REMOVE_CHUNK) {
    chunks.push(unique.slice(i, i + REMOVE_CHUNK));
  }

  for (let i = 0; i < chunks.length; i += REMOVE_CONCURRENCY) {
    const wave = chunks.slice(i, i + REMOVE_CONCURRENCY);

    const settled = await Promise.all(
      wave.map(async (chunk) => {
        try {
          const { data, error } = await supabase.storage.from(bucket).remove(chunk);
          if (error) return { ok: false as const, size: chunk.length, message: error.message };
          return { ok: true as const, size: data?.length ?? chunk.length };
        } catch (e) {
          return {
            ok: false as const,
            size: chunk.length,
            message: e instanceof Error ? e.message : String(e),
          };
        }
      }),
    );

    settled.forEach((r) => {
      if (r.ok) {
        result.removed += r.size;
        return;
      }
      result.failed += r.size;
      if (result.errors.length < 5) result.errors.push(r.message);
    });
  }

  if (result.failed > 0) {
    console.error(
      `🗄️ Storage cleanup: ${result.failed}/${result.attempted} files could not be removed`,
      result.errors,
    );

    void logProcessingError({
      errorType: 'storage_delete_failed',
      message: result.errors[0] ?? 'Storage removal failed',
      failedCount: result.failed,
      metadata: {
        bucket,
        attempted: result.attempted,
        removed: result.removed,
        errors: result.errors,
      },
    });
  }

  return result;
};
