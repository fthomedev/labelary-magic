-- Create donations table to track real donations
CREATE TABLE public.donations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_payment_intent_id text UNIQUE,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'brl',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read donation count (for the counter)
CREATE POLICY "Anyone can view donations count"
ON public.donations
FOR SELECT
USING (true);

-- Service role can insert/update donations (via webhook)
-- No insert policy for regular users - only service role can insert