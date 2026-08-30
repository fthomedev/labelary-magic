CREATE TABLE public.conversion_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  processing_history_id uuid REFERENCES public.processing_history(id) ON DELETE SET NULL,
  rating smallint NOT NULL,
  comment text,
  processing_type text,
  label_count integer,
  processing_time_ms integer,
  two_column boolean,
  label_size text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.conversion_ratings TO authenticated;
GRANT ALL ON public.conversion_ratings TO service_role;

ALTER TABLE public.conversion_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own ratings"
ON public.conversion_ratings
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own ratings"
ON public.conversion_ratings
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.validate_conversion_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.rating < 1 OR NEW.rating > 5 THEN
    RAISE EXCEPTION 'rating must be between 1 and 5';
  END IF;
  IF NEW.comment IS NOT NULL AND length(NEW.comment) > 2000 THEN
    RAISE EXCEPTION 'comment too long';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_conversion_rating_trigger
BEFORE INSERT OR UPDATE ON public.conversion_ratings
FOR EACH ROW EXECUTE FUNCTION public.validate_conversion_rating();

CREATE INDEX idx_conversion_ratings_user_created ON public.conversion_ratings (user_id, created_at DESC);
CREATE INDEX idx_conversion_ratings_rating ON public.conversion_ratings (rating);