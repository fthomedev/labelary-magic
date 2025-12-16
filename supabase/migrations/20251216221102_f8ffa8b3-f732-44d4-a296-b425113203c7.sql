-- Create pngs bucket as private (or update if exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('pngs', 'pngs', false, 5242880)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Add RLS policies for pngs bucket
CREATE POLICY "Users can view their own PNG files"
ON storage.objects FOR SELECT
USING (bucket_id = 'pngs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own PNG files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'pngs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own PNG files"
ON storage.objects FOR DELETE
USING (bucket_id = 'pngs' AND auth.uid()::text = (storage.foldername(name))[1]);