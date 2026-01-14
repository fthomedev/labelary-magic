-- Enable RLS on donations table (should already be enabled, but ensure it)
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Deny all direct SELECT access to donations table
-- The get_completed_donations_count() function with SECURITY DEFINER 
-- already provides safe access to aggregate donation data
CREATE POLICY "No direct access to donations"
ON public.donations
FOR SELECT
USING (false);

-- Note: INSERT/UPDATE operations are handled by the stripe-webhook 
-- edge function using the service role key, so no user policies needed