import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';

const RETENTION_DAYS = 60;
const ORPHAN_RETENTION_DAYS = 7;  // orphan files are only swept after 7 days
const HISTORY_BATCH = 150;        // history rows per run
const ORPHAN_BATCH = 300;         // orphan storage objects per run
const REMOVE_CHUNK = 100;         // files per Storage API call
const REMOVE_CONCURRENCY = 2;     // parallel Storage API calls
const BUCKET = 'pdfs';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

/** Removes paths from storage in chunks (a few chunks in parallel). */
async function removeFiles(
  supabase: ReturnType<typeof createClient>,
  paths: string[],
): Promise<{ removed: number; errors: string[] }> {
  let removed = 0;
  const errors: string[] = [];

  const chunks: string[][] = [];
  for (let i = 0; i < paths.length; i += REMOVE_CHUNK) {
    chunks.push(paths.slice(i, i + REMOVE_CHUNK));
  }

  for (let i = 0; i < chunks.length; i += REMOVE_CONCURRENCY) {
    const wave = chunks.slice(i, i + REMOVE_CONCURRENCY);
    const results = await Promise.all(
      wave.map((chunk) => supabase.storage.from(BUCKET).remove(chunk)),
    );

    results.forEach((result, index) => {
      if (result.error) {
        console.error(`Storage remove failed for chunk ${i + index}:`, result.error.message);
        errors.push(result.error.message);
        return;
      }
      removed += result.data?.length ?? wave[index].length;
    });
  }

  return { removed, errors };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !serviceKey) {
    return json({ error: 'Server not configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // --- Auth: shared secret stored in the database, sent by the cron job ---
  const provided = req.headers.get('x-cron-secret') ?? '';
  const { data: secretRow, error: secretError } = await supabase
    .from('cron_config')
    .select('value')
    .eq('key', 'purge_cron_secret')
    .maybeSingle();

  if (secretError || !secretRow?.value) {
    console.error('Could not read purge secret:', secretError?.message);
    return json({ error: 'Purge secret not configured' }, 500);
  }
  if (provided !== secretRow.value) {
    return json({ error: 'Unauthorized' }, 401);
  }

  const startedAt = Date.now();
  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString();

  let historyRowsDeleted = 0;
  let historyFilesRemoved = 0;
  let orphanFilesRemoved = 0;
  const errors: string[] = [];

  try {
    // ================= Phase A: expired history records + their files =================
    const { data: oldRows, error: selectError } = await supabase
      .from('processing_history')
      .select('id, pdf_path')
      .lt('date', cutoff)
      .order('date', { ascending: true })
      .limit(HISTORY_BATCH);

    if (selectError) throw new Error(`select history failed: ${selectError.message}`);

    if (oldRows && oldRows.length > 0) {
      const paths = oldRows
        .map((r) => r.pdf_path as string | null)
        .filter((p): p is string => !!p);

      if (paths.length > 0) {
        const result = await removeFiles(supabase, paths);
        historyFilesRemoved = result.removed;
        errors.push(...result.errors);
      }

      // Delete the rows only after the storage cleanup attempt, so a failure
      // leaves the row around for the next run instead of orphaning the file.
      const ids = oldRows.map((r) => r.id as string);
      const { error: deleteError } = await supabase
        .from('processing_history')
        .delete()
        .in('id', ids);

      if (deleteError) throw new Error(`delete history failed: ${deleteError.message}`);
      historyRowsDeleted = ids.length;
    }

    // ================= Phase B: orphan files with no history record =================
    const { data: orphans, error: orphanError } = await supabase.rpc(
      'list_purgeable_pdf_objects',
      { p_limit: ORPHAN_BATCH, p_retention_days: ORPHAN_RETENTION_DAYS },
    );

    if (orphanError) {
      errors.push(`list orphans failed: ${orphanError.message}`);
    } else if (orphans && orphans.length > 0) {
      const orphanPaths = (orphans as { name: string }[]).map((o) => o.name);
      const result = await removeFiles(supabase, orphanPaths);
      orphanFilesRemoved = result.removed;
      errors.push(...result.errors);
    }

    const totalFiles = historyFilesRemoved + orphanFilesRemoved;

    await supabase.from('processing_history_purge_audit').insert({
      deleted_count: historyRowsDeleted,
      retention_days: RETENTION_DAYS,
      ran_by: `purge-old-files (files: ${totalFiles})`,
    });

    const durationMs = Date.now() - startedAt;
    console.log(
      `🧹 Purge done in ${durationMs}ms — history rows: ${historyRowsDeleted}, ` +
      `files from history: ${historyFilesRemoved}, orphan files: ${orphanFilesRemoved}`,
    );

    return json({
      success: true,
      retentionDays: RETENTION_DAYS,
      historyRowsDeleted,
      historyFilesRemoved,
      orphanFilesRemoved,
      totalFilesRemoved: totalFiles,
      hasMore: historyRowsDeleted === HISTORY_BATCH || orphanFilesRemoved >= ORPHAN_BATCH,
      durationMs,
      errors: errors.slice(0, 5),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Purge failed:', message);
    return json({ success: false, error: message, historyRowsDeleted, historyFilesRemoved, orphanFilesRemoved }, 500);
  }
});
