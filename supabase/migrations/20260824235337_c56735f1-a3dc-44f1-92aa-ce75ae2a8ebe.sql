ALTER TABLE public.processing_errors
  ADD COLUMN IF NOT EXISTS zpl_format text,
  ADD COLUMN IF NOT EXISTS label_size text,
  ADD COLUMN IF NOT EXISTS two_column boolean,
  ADD COLUMN IF NOT EXISTS has_images boolean,
  ADD COLUMN IF NOT EXISTS batch_size integer,
  ADD COLUMN IF NOT EXISTS http_status integer,
  ADD COLUMN IF NOT EXISTS failed_count integer,
  ADD COLUMN IF NOT EXISTS app_version text,
  ADD COLUMN IF NOT EXISTS user_agent text;

CREATE INDEX IF NOT EXISTS processing_errors_created_at_idx ON public.processing_errors (created_at DESC);
CREATE INDEX IF NOT EXISTS processing_errors_error_type_idx ON public.processing_errors (error_type);
CREATE INDEX IF NOT EXISTS processing_errors_user_created_idx ON public.processing_errors (user_id, created_at DESC);