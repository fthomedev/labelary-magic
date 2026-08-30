-- Run the cleanup every 10 minutes so the 160k orphan backlog drains in ~1 day;
-- once caught up each run is a no-op.
DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobname FROM cron.job
    WHERE username = current_user AND jobname = 'purge-old-files-daily'
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END;
$$;

SELECT cron.schedule(
  'purge-old-files',
  '*/10 * * * *',
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