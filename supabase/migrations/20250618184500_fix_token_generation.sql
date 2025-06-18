
-- Fix the generate_secure_token function to use supported encoding
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Use hex encoding instead of base64url which is not supported
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Update the create_file_access_token function with better error handling
CREATE OR REPLACE FUNCTION public.create_file_access_token(
  p_file_path TEXT,
  p_bucket_name TEXT DEFAULT 'pdfs',
  p_expires_hours INTEGER DEFAULT 24,
  p_max_access INTEGER DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_token TEXT;
  v_user_id UUID;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  -- Generate a secure token using hex encoding
  v_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert the token record
  INSERT INTO public.file_access_tokens (
    token,
    user_id,
    file_path,
    bucket_name,
    expires_at,
    max_access
  ) VALUES (
    v_token,
    v_user_id,
    p_file_path,
    p_bucket_name,
    now() + (p_expires_hours || ' hours')::INTERVAL,
    p_max_access
  );
  
  RETURN v_token;
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create token: %', SQLERRM;
END;
$$;
