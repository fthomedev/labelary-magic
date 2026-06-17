
-- 1. cleanup_state: enable RLS, no policies = service_role only
ALTER TABLE public.cleanup_state ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.cleanup_state FROM anon, authenticated;
GRANT ALL ON public.cleanup_state TO service_role;

-- 2. subscriptions: remove user-facing INSERT/UPDATE; managed via service_role (Stripe webhook)
DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscriptions" ON public.subscriptions;

-- 3. processing_history_purge_audit: explicit restrictive deny for any non-service writes/reads
REVOKE ALL ON public.processing_history_purge_audit FROM anon, authenticated;
GRANT ALL ON public.processing_history_purge_audit TO service_role;
CREATE POLICY "Deny all client access to purge audit"
  ON public.processing_history_purge_audit
  AS RESTRICTIVE
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- 4. processing_logs: allow users to delete their own logs
CREATE POLICY "Users can delete their own processing logs"
  ON public.processing_logs
  FOR DELETE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- 5. Fix mutable search_path on purge_history_and_storage_older_than_60d
CREATE OR REPLACE FUNCTION public.purge_history_and_storage_older_than_60d()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public, pg_temp
AS $function$
DECLARE
  v_deleted_count integer := 0;
  v_batch_size integer := 2000;
BEGIN
  WITH old_rows AS (
    SELECT id, pdf_path
    FROM public.processing_history
    WHERE date < now() - interval '60 days'
      AND pdf_path IS NOT NULL
    ORDER BY date ASC
    LIMIT v_batch_size
  ), del_storage AS (
    DELETE FROM storage.objects s
    USING old_rows o
    WHERE s.bucket_id = 'pdfs'
      AND s.name = o.pdf_path
    RETURNING 1
  ), del_history AS (
    DELETE FROM public.processing_history ph
    USING old_rows o
    WHERE ph.id = o.id
    RETURNING 1
  )
  SELECT COALESCE(count(*),0) INTO v_deleted_count FROM del_history;

  INSERT INTO public.processing_history_purge_audit(deleted_count, retention_days, ran_by)
  VALUES (v_deleted_count, 60, CURRENT_USER);

  RETURN v_deleted_count;
END;
$function$;

-- 6. Revoke EXECUTE on internal/admin/trigger SECURITY DEFINER functions
REVOKE ALL ON FUNCTION public.reset_all_usage_counts() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.reset_daily_usage() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.purge_history_and_storage_older_than_60d() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_processing_history() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.purge_old_processing_history(integer) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.run_purge_old_processing_history() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.delete_old_file(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.delete_storage_and_mark(uuid) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.insert_processing_history() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.insert_processing_history(text, text) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.insert_processing_history(uuid, integer, text, text) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.generate_secure_token() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.create_free_subscription_for_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.update_subscription_plan_details() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM anon, authenticated, PUBLIC;
