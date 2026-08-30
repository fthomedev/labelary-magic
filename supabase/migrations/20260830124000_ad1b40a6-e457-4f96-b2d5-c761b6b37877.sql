CREATE OR REPLACE FUNCTION public.purge_old_processing_errors(retention_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_deleted integer := 0;
BEGIN
  DELETE FROM public.processing_errors
  WHERE created_at < now() - make_interval(days => retention_days);
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purge_old_processing_errors(integer) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.purge_old_processing_errors(integer) TO service_role;

CREATE INDEX IF NOT EXISTS processing_errors_created_at_idx ON public.processing_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS processing_errors_error_type_idx ON public.processing_errors (error_type);