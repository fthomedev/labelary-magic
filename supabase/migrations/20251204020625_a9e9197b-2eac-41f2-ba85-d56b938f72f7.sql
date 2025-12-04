-- Remove old permissive storage policies that bypass the new secure ones
DROP POLICY IF EXISTS "Allow public to read PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload PDFs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload" ON storage.objects;

-- The new policies created in the previous migration are correct:
-- "Users can view their own PDF files"
-- "Users can upload their own PDF files"  
-- "Users can delete their own PDF files"
-- They use storage.foldername(name)[1] which requires files to be in user_id/ folders