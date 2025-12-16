-- Remove email column from profiles table (email should come from auth.users)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS email;

-- Update handle_new_user trigger to not insert email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (new.id);
  RETURN new;
END;
$function$;