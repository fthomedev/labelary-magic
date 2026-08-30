-- Cron job #2 belongs to another role and cannot be unscheduled from here.
-- Replace the function it calls with a harmless no-op so it stops deleting
-- history rows without their files; the real cleanup is the purge-old-files job.
CREATE OR REPLACE FUNCTION public.purge_history_and_storage_older_than_60d()
RETURNS integer
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Deprecated: superseded by the purge-old-files edge function (cron job
  -- 'purge-old-files-daily'), which removes the storage files as well.
  RETURN 0;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_history_and_storage_older_than_60d() FROM PUBLIC, anon, authenticated;