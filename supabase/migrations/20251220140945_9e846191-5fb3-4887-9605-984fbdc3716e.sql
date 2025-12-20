-- Remove the insecure public SELECT policy
DROP POLICY IF EXISTS "Anyone can view donations count" ON public.donations;

-- Create a secure function that returns only the count (no sensitive data)
CREATE OR REPLACE FUNCTION public.get_completed_donations_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(*)::integer, 0)
  FROM public.donations
  WHERE status = 'completed';
$$;