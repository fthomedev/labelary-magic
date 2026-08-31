CREATE OR REPLACE FUNCTION public.list_purgeable_pdf_objects(p_limit integer DEFAULT 300, p_retention_days integer DEFAULT 7)
 RETURNS TABLE(name text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'storage', 'pg_temp'
 SET statement_timeout TO '20s'
AS $function$
  SELECT o.name
  FROM storage.objects o
  WHERE o.bucket_id = 'pdfs'
    AND o.created_at < now() - make_interval(days => GREATEST(COALESCE(p_retention_days, 7), 1))
    AND NOT EXISTS (
      SELECT 1 FROM public.processing_history h WHERE h.pdf_path = o.name
    )
  ORDER BY o.name
  LIMIT LEAST(GREATEST(p_limit, 1), 1000);
$function$;