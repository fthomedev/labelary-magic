
-- Add usage_quota and usage columns to the subscriptions table
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS usage_quota INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS usage_reset_date TIMESTAMP WITH TIME ZONE;

-- Create function to reset daily usage
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Reset the usage_count for subscriptions that need to be reset
  UPDATE public.subscriptions
  SET 
    usage_count = 0,
    usage_reset_date = NOW() + INTERVAL '1 day'
  WHERE usage_reset_date <= NOW() OR usage_reset_date IS NULL;
END;
$$;

-- Create a trigger function to update subscription plan details when subscriptions change
CREATE OR REPLACE FUNCTION public.update_subscription_plan_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Free plan: 10 labels per day
  IF NEW.price_id IS NULL THEN
    NEW.usage_quota := 10;
  -- Basic plan: 50 labels per day
  ELSIF NEW.price_id LIKE '%basic%' THEN
    NEW.usage_quota := 50;
  -- Advanced plan: 100 labels per day
  ELSIF NEW.price_id LIKE '%advanced%' THEN
    NEW.usage_quota := 100;
  -- Unlimited plan: -1 (no limit)
  ELSIF NEW.price_id LIKE '%unlimited%' THEN
    NEW.usage_quota := -1;
  -- Default: 10 labels per day (free tier)
  ELSE
    NEW.usage_quota := 10;
  END IF;
  
  -- Set usage_reset_date to tomorrow if not already set
  IF NEW.usage_reset_date IS NULL THEN
    NEW.usage_reset_date := NOW() + INTERVAL '1 day';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to update plan details when subscription changes
CREATE TRIGGER update_subscription_details
BEFORE INSERT OR UPDATE ON public.subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_subscription_plan_details();
