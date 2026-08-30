-- Speed up the orphan lookup: anti-join on pdf_path was a sequential scan
CREATE INDEX IF NOT EXISTS idx_processing_history_pdf_path
  ON public.processing_history (pdf_path);

CREATE OR REPLACE FUNCTION public.list_purgeable_pdf_objects(
  p_limit integer DEFAULT 5000,
  p_retention_days integer DEFAULT 60
)
RETURNS TABLE(name text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, storage, pg_temp
SET statement_timeout = '120s'
AS $$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'pdfs'
    AND o.created_at < now() - make_interval(days => p_retention_days)
    AND NOT EXISTS (
      SELECT 1 FROM public.processing_history h WHERE h.pdf_path = o.name
    )
  LIMIT LEAST(GREATEST(p_limit, 1), 10000);
$$;

REVOKE ALL ON FUNCTION public.list_purgeable_pdf_objects(integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_purgeable_pdf_objects(integer, integer) TO service_role;