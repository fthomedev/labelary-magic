
-- Create a table to store secure file access tokens
CREATE TABLE public.file_access_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users NOT NULL,
  file_path TEXT NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'pdfs',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accessed_count INTEGER NOT NULL DEFAULT 0,
  max_access INTEGER DEFAULT NULL -- NULL means unlimited access
);

-- Add Row Level Security
ALTER TABLE public.file_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view their own tokens
CREATE POLICY "Users can view their own file tokens" 
  ON public.file_access_tokens 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy to allow users to create their own tokens
CREATE POLICY "Users can create their own file tokens" 
  ON public.file_access_tokens 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own tokens (for access counting)
CREATE POLICY "Users can update their own file tokens" 
  ON public.file_access_tokens 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy to allow users to delete their own tokens
CREATE POLICY "Users can delete their own file tokens" 
  ON public.file_access_tokens 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Index for better performance on token lookup
CREATE INDEX idx_file_access_tokens_token ON public.file_access_tokens(token);
CREATE INDEX idx_file_access_tokens_expires_at ON public.file_access_tokens(expires_at);

-- Function to generate a random token
CREATE OR REPLACE FUNCTION public.generate_secure_token()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Function to create a secure file access token
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
  
  -- Generate a secure token
  v_token := public.generate_secure_token();
  
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
END;
$$;
