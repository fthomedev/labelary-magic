-- Fix SECURITY DEFINER functions to include proper authentication checks

-- 1. Fix check_free_tier_usage - Add authentication and authorization
CREATE OR REPLACE FUNCTION public.check_free_tier_usage(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_count INTEGER;
  calling_user UUID;
BEGIN
  calling_user := auth.uid();
  
  -- Verify user is authenticated
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify user is checking their own usage
  IF calling_user != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: Can only check your own usage';
  END IF;
  
  -- Count labels processed today for the user
  SELECT COALESCE(SUM(label_count), 0)
  INTO total_count
  FROM public.processing_history
  WHERE user_id = user_id_param
  AND date >= CURRENT_DATE;
  
  RETURN total_count;
END;
$$;

-- 2. Fix increment_usage_count - Add authentication and authorization
CREATE OR REPLACE FUNCTION public.increment_usage_count(user_id_param UUID, increment_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  subscription_record RECORD;
  can_increment BOOLEAN := FALSE;
  calling_user UUID;
BEGIN
  calling_user := auth.uid();
  
  -- Verify user is authenticated
  IF calling_user IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Verify user is incrementing their own usage
  IF calling_user != user_id_param THEN
    RAISE EXCEPTION 'Unauthorized: Can only modify your own usage';
  END IF;
  
  -- Get user's subscription
  SELECT * INTO subscription_record
  FROM public.subscriptions
  WHERE user_id = user_id_param;
  
  -- If no subscription found, user is on free tier
  IF NOT FOUND THEN
    -- Check free tier usage
    IF (SELECT public.check_free_tier_usage(user_id_param)) + increment_amount <= 10 THEN
      can_increment := TRUE;
    ELSE
      can_increment := FALSE;
    END IF;
    RETURN can_increment;
  END IF;
  
  -- If unlimited plan, always allow
  IF subscription_record.usage_quota = -1 THEN
    RETURN TRUE;
  END IF;
  
  -- Check if incrementing would exceed limit
  IF subscription_record.usage_count + increment_amount <= subscription_record.usage_quota THEN
    -- Increment usage count
    UPDATE public.subscriptions
    SET usage_count = usage_count + increment_amount
    WHERE user_id = user_id_param;
    
    can_increment := TRUE;
  ELSE
    can_increment := FALSE;
  END IF;
  
  RETURN can_increment;
END;
$$;

-- 3. Fix reset_all_usage_counts - This is an administrative function called by cron
-- We change it to use SECURITY INVOKER so it only works when called with service_role
-- The pg_cron extension uses the database owner role, which has appropriate privileges
CREATE OR REPLACE FUNCTION public.reset_all_usage_counts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- This function should only be called by service_role or pg_cron
  -- Using SECURITY INVOKER means it runs with caller's privileges
  -- Regular users won't have direct UPDATE access to subscriptions for other users
  
  -- Reset usage counts for all subscriptions
  UPDATE public.subscriptions
  SET 
    usage_count = 0,
    usage_reset_date = NOW() + INTERVAL '1 day';
END;
$$;

-- Note: log_user_access already has proper authentication handling
-- It safely gets auth.uid() and only proceeds if the user is authenticated
-- The current behavior of silently doing nothing for unauthenticated users is intentional
-- No changes needed for log_user_access