-- Enable RLS on processing_history_purge_audit table
-- This is an internal audit table that should not be accessible to regular users
-- No policies are added, which blocks all public access
-- The SECURITY DEFINER functions (purge_old_processing_history) can still insert records

ALTER TABLE public.processing_history_purge_audit ENABLE ROW LEVEL SECURITY;

-- Add a comment explaining the security model
COMMENT ON TABLE public.processing_history_purge_audit IS 'Internal audit table for processing history purge operations. RLS enabled with no policies - only accessible via SECURITY DEFINER functions.';