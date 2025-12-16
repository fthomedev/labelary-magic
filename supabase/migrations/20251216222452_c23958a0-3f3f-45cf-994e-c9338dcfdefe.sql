-- Fix SECURITY DEFINER functions missing search_path

-- 1. insert_processing_history(p_user_id uuid, p_label_count integer, p_pdf_url text, p_pdf_path text)
CREATE OR REPLACE FUNCTION public.insert_processing_history(
  p_user_id uuid, 
  p_label_count integer, 
  p_pdf_url text,
  p_pdf_path text DEFAULT NULL::text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
    INSERT INTO public.processing_history (user_id, label_count, pdf_url, pdf_path)
    VALUES (p_user_id, p_label_count, p_pdf_url, p_pdf_path);
END;
$function$;

-- 2. reset_daily_usage()
CREATE OR REPLACE FUNCTION public.reset_daily_usage()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.subscriptions
  SET 
    usage_count = 0,
    usage_reset_date = NOW() + INTERVAL '1 day'
  WHERE usage_reset_date <= NOW() OR usage_reset_date IS NULL;
END;
$function$;

-- 3. update_subscription_plan_details() - trigger function
CREATE OR REPLACE FUNCTION public.update_subscription_plan_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
$function$;

-- 4. create_free_subscription_for_new_user() - trigger function
CREATE OR REPLACE FUNCTION public.create_free_subscription_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.subscriptions (
    user_id, 
    status,
    usage_quota,
    usage_count,
    usage_reset_date
  ) VALUES (
    NEW.id,
    'active',
    10,
    0,
    NOW() + INTERVAL '1 day'
  );
  
  RETURN NEW;
END;
$function$;

-- 5. delete_user()
CREATE OR REPLACE FUNCTION public.delete_user()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  _user_id uuid;
  _pdf_paths text[];
  _path text;
  result json;
BEGIN
  _user_id := auth.uid();
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  SELECT array_agg(pdf_path) INTO _pdf_paths
  FROM public.processing_history
  WHERE user_id = _user_id AND pdf_path IS NOT NULL;
  
  DELETE FROM public.processing_history WHERE user_id = _user_id;
  DELETE FROM public.subscriptions WHERE user_id = _user_id;
  DELETE FROM public.profiles WHERE id = _user_id;
  
  IF _pdf_paths IS NOT NULL THEN
    FOREACH _path IN ARRAY _pdf_paths
    LOOP
      DELETE FROM storage.objects WHERE name = _path;
    END LOOP;
  END IF;
  
  DELETE FROM auth.users WHERE id = _user_id;
  
  result := json_build_object('success', true, 'message', 'User and associated files deleted successfully');
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    result := json_build_object('success', false, 'message', SQLERRM);
    RETURN result;
END;
$function$;

-- 6. handle_new_user() - trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$function$;

-- 7. create_file_access_token()
CREATE OR REPLACE FUNCTION public.create_file_access_token(
  p_file_path text, 
  p_bucket_name text DEFAULT 'pdfs'::text, 
  p_expires_hours integer DEFAULT 24, 
  p_max_access integer DEFAULT NULL::integer
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_token TEXT;
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;
  
  v_token := encode(gen_random_bytes(32), 'hex');
  
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
$function$;