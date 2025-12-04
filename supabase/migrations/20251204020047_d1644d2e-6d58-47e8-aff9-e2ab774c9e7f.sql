-- Fix database functions missing SET search_path = public
-- This prevents schema injection attacks in SECURITY DEFINER functions

-- Fix delete_old_file function
CREATE OR REPLACE FUNCTION public.delete_old_file(record_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
begin
  -- Apenas atualiza a linha marcando como removida
  update processing_history
  set removed_at = now()
  where id = record_id;
end;
$function$;

-- Fix delete_storage_and_mark function
CREATE OR REPLACE FUNCTION public.delete_storage_and_mark(id_input uuid)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  file_path text;
BEGIN
  -- Buscar o caminho do arquivo
  SELECT pdf_path INTO file_path
  FROM processing_history
  WHERE id = id_input;

  -- Apagar do Storage
  PERFORM storage.delete_object('processed-files', file_path);

  -- Marcar como removido
  UPDATE processing_history
  SET removed_at = NOW()
  WHERE id = id_input;
END;
$function$;

-- Fix generate_secure_token function (remove runtime set_config, use function-level setting)
CREATE OR REPLACE FUNCTION public.generate_secure_token()
 RETURNS text
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
DECLARE
  token text;
BEGIN
  -- Gera o token
  SELECT encode(gen_random_bytes(32), 'hex') INTO token;
  RETURN token;
END;
$function$;

-- Fix insert_processing_history overloaded functions
CREATE OR REPLACE FUNCTION public.insert_processing_history(p_file_name text, p_status text)
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    INSERT INTO processing_history (file_name, status, inserted_at)
    VALUES (p_file_name, p_status, now());
END;
$function$;

CREATE OR REPLACE FUNCTION public.insert_processing_history()
 RETURNS void
 LANGUAGE plpgsql
 SET search_path = public
AS $function$
BEGIN
    -- Function logic here
END;
$function$;

-- Make pdfs bucket private
UPDATE storage.buckets SET public = false WHERE id = 'pdfs';

-- Add RLS policies for pdfs storage bucket
CREATE POLICY "Users can view their own PDF files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own PDF files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PDF files"
ON storage.objects FOR DELETE
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);