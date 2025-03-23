
-- Add pdf_path column to processing_history table
ALTER TABLE public.processing_history
ADD COLUMN pdf_path TEXT;

-- Update the insert_processing_history function to accept pdf_path parameter
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
