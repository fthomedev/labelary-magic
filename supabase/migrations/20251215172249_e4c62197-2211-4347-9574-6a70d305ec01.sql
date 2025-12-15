-- Create user_access_logs table to track user sessions
CREATE TABLE public.user_access_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  accessed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  ip_hash text
);

-- Create index for efficient queries on user_id and accessed_at
CREATE INDEX idx_user_access_logs_user_id ON public.user_access_logs(user_id);
CREATE INDEX idx_user_access_logs_accessed_at ON public.user_access_logs(accessed_at);
CREATE INDEX idx_user_access_logs_user_date ON public.user_access_logs(user_id, accessed_at DESC);

-- Enable RLS
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

-- Users can only insert their own access logs
CREATE POLICY "Users can insert their own access logs"
ON public.user_access_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can view their own access logs
CREATE POLICY "Users can view their own access logs"
ON public.user_access_logs
FOR SELECT
USING (auth.uid() = user_id);

-- Create view for recurring users (accessed more than once in last 7 days)
CREATE OR REPLACE VIEW public.recurring_users_last_7_days AS
SELECT 
  user_id,
  COUNT(*) as access_count,
  MIN(accessed_at) as first_access,
  MAX(accessed_at) as last_access
FROM public.user_access_logs
WHERE accessed_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Create function to log user access (to be called on app load)
CREATE OR REPLACE FUNCTION public.log_user_access()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NOT NULL THEN
    -- Only log if last access was more than 1 hour ago (avoid spam)
    IF NOT EXISTS (
      SELECT 1 FROM public.user_access_logs 
      WHERE user_id = _user_id 
      AND accessed_at > NOW() - INTERVAL '1 hour'
    ) THEN
      INSERT INTO public.user_access_logs (user_id)
      VALUES (_user_id);
    END IF;
  END IF;
END;
$$;