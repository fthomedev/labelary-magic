-- Add UPDATE policy so users can update their own processing history
CREATE POLICY "Users can update their own processing history"
ON public.processing_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Add DELETE policy so users can delete their own processing history
CREATE POLICY "Users can delete their own processing history"
ON public.processing_history
FOR DELETE
USING (auth.uid() = user_id);