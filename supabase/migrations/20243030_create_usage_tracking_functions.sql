
-- Create function to check free tier usage
CREATE OR REPLACE FUNCTION public.check_free_tier_usage(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_count INTEGER;
BEGIN
  -- Count labels processed today for the user
  SELECT COALESCE(SUM(label_count), 0)
  INTO total_count
  FROM public.processing_history
  WHERE user_id = user_id_param
  AND date >= CURRENT_DATE;
  
  RETURN total_count;
END;
$$;

-- Create function to increment usage count
CREATE OR REPLACE FUNCTION public.increment_usage_count(user_id_param UUID, increment_amount INTEGER DEFAULT 1)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  subscription_record RECORD;
  can_increment BOOLEAN := FALSE;
BEGIN
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

-- Create function to reset usage counts daily (to be called by a cron job)
CREATE OR REPLACE FUNCTION public.reset_all_usage_counts()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset usage counts for all subscriptions
  UPDATE public.subscriptions
  SET 
    usage_count = 0,
    usage_reset_date = NOW() + INTERVAL '1 day';
  
  -- Log the reset (optional)
  INSERT INTO public.maintenance_logs (action, details)
  VALUES ('usage_reset', 'Reset all usage counts at ' || NOW()::text)
  ON CONFLICT DO NOTHING;
  
  EXCEPTION WHEN undefined_table THEN
    -- If maintenance_logs table doesn't exist, just ignore
    NULL;
END;
$$;
