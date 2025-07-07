-- Create table for history usage survey
CREATE TABLE public.history_usage_survey (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  response TEXT NOT NULL CHECK (response IN ('useful', 'used_once', 'never_used')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.history_usage_survey ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own survey responses" 
ON public.history_usage_survey 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own survey responses" 
ON public.history_usage_survey 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create index for better performance
CREATE INDEX idx_history_usage_survey_user_id ON public.history_usage_survey(user_id);
CREATE INDEX idx_history_usage_survey_response ON public.history_usage_survey(response);