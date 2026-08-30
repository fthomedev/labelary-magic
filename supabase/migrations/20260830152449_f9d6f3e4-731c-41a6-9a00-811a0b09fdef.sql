DO $$
DECLARE
  j record;
BEGIN
  FOR j IN
    SELECT jobname FROM cron.job
    WHERE username = current_user AND jobname IN ('purge-old-files', 'purge-old-files-daily')
  LOOP
    PERFORM cron.unschedule(j.jobname);
  END LOOP;
END;
$$;

-- pg_net lives in schema "net" on this project
SELECT cron.schedule(
  'purge-old-files',
  '*/10 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://ekoakbihwprthzjyztwq.supabase.co/functions/v1/purge-old-files',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (SELECT value FROM public.cron_config WHERE key = 'purge_cron_secret')
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 120000
  );
  $cron$
);