
CREATE OR REPLACE FUNCTION public.delete_processing_history_bulk(
  record_ids uuid[] DEFAULT NULL,
  delete_all boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  _user_id uuid;
  _deleted_paths text[];
  _deleted_count integer := 0;
BEGIN
  _user_id := auth.uid();

  IF _user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User not authenticated', 'deleted_count', 0);
  END IF;

  IF delete_all THEN
    WITH del AS (
      DELETE FROM public.processing_history
      WHERE user_id = _user_id
      RETURNING pdf_path
    )
    SELECT COALESCE(array_agg(pdf_path) FILTER (WHERE pdf_path IS NOT NULL), ARRAY[]::text[]),
           COUNT(*)
    INTO _deleted_paths, _deleted_count
    FROM del;
  ELSE
    IF record_ids IS NULL OR array_length(record_ids, 1) IS NULL THEN
      RETURN json_build_object('success', true, 'deleted_count', 0, 'deleted_paths', ARRAY[]::text[]);
    END IF;

    WITH del AS (
      DELETE FROM public.processing_history
      WHERE user_id = _user_id
        AND id = ANY(record_ids)
      RETURNING pdf_path
    )
    SELECT COALESCE(array_agg(pdf_path) FILTER (WHERE pdf_path IS NOT NULL), ARRAY[]::text[]),
           COUNT(*)
    INTO _deleted_paths, _deleted_count
    FROM del;
  END IF;

  IF _deleted_paths IS NOT NULL AND array_length(_deleted_paths, 1) IS NOT NULL THEN
    DELETE FROM storage.objects
    WHERE bucket_id = 'pdfs'
      AND name = ANY(_deleted_paths);
  END IF;

  RETURN json_build_object(
    'success', true,
    'deleted_count', _deleted_count,
    'deleted_paths', COALESCE(_deleted_paths, ARRAY[]::text[])
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM, 'deleted_count', 0);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.delete_processing_history_bulk(uuid[], boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.delete_processing_history_bulk(uuid[], boolean) TO authenticated;
