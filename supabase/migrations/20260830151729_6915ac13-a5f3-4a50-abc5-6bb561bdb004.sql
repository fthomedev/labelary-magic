-- 1. Internal config table holding the purge secret (no client access at all)
CREATE TABLE IF NOT EXISTS public.cron_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.cron_config TO service_role;
GRANT ALL ON public.cron_config TO service_role;

ALTER TABLE public.cron_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access to cron config"
ON public.cron_config
AS RESTRICTIVE
FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

INSERT INTO public.cron_config (key, value)
VALUES ('purge_cron_secret', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

-- 2. Lists storage objects older than the retention window that have no
--    matching processing_history row. Service-role only (edge function).
CREATE OR REPLACE FUNCTION public.list_purgeable_pdf_objects(
  p_limit integer DEFAULT 5000,
  p_retention_days integer DEFAULT 60
)
RETURNS TABLE(name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage, pg_temp
AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'pdfs'
    AND o.created_at < now() - make_interval(days => p_retention_days)
    AND NOT EXISTS (
      SELECT 1 FROM public.processing_history h WHERE h.pdf_path = o.name
    )
  ORDER BY o.created_at ASC
  LIMIT LEAST(GREATEST(p_limit, 1), 10000);
$$;

REVOKE ALL ON FUNCTION public.list_purgeable_pdf_objects(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_purgeable_pdf_objects(integer, integer) TO service_role;

-- 3. Replace the three conflicting cron jobs with a single one
DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobid, jobname FROM cron.job
    WHERE username = current_user
      AND (command ILIKE '%purge_history_and_storage_older_than_60d%'
        OR command ILIKE '%purge_old_processing_history%'
        OR command ILIKE '%purge_pdfs%'
        OR jobname = 'purge-old-files-daily')
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

SELECT cron.schedule(
  'purge-old-files-daily',
  '0 2 * * *',
  $cron$
  SELECT extensions.http_post(
    url := 'https://ekoakbihwprthzjyztwq.supabase.co/functions/v1/purge-old-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT value FROM public.cron_config WHERE key = 'purge_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $cron$
);

-- 4. Drop the obsolete purge routines so they cannot be scheduled again
DROP FUNCTION IF EXISTS public.run_purge_old_processing_history();
DROP FUNCTION IF EXISTS public.purge_history_and_storage_older_than_60d();
DROP FUNCTION IF EXISTS public.purge_old_processing_history();
DROP FUNCTION IF EXISTS public.purge_old_processing_history(integer);
DROP FUNCTION IF EXISTS public.delete_storage_and_mark(uuid);
DROP FUNCTION IF EXISTS public.delete_old_file(uuid);