
-- Check if pdf_path column exists, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'processing_history' 
        AND column_name = 'pdf_path'
    ) THEN
        ALTER TABLE public.processing_history
        ADD COLUMN pdf_path TEXT;
    END IF;
END $$;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS public.insert_processing_history;

-- Recreate the function with pdf_path parameter
CREATE OR REPLACE FUNCTION public.insert_processing_history(
  p_user_id uuid, 
  p_label_count integer, 
  p_pdf_url text,
  p_pdf_path text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    INSERT INTO public.processing_history (user_id, label_count, pdf_url, pdf_path)
    VALUES (p_user_id, p_label_count, p_pdf_url, p_pdf_path);
END;
$function$;
