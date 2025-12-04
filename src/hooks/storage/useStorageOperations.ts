
import { supabase } from '@/integrations/supabase/client';

export const useStorageOperations = () => {
  const ensurePdfBucketExists = async () => {
    // The 'pdfs' bucket is private and already exists in Supabase.
    // We cannot use getBucket() with anon key on private buckets (returns 404).
    // RLS policies control file access, so we just proceed with the upload.
    // If bucket doesn't exist, the upload will fail and we handle it there.
    console.log('📦 Using existing pdfs bucket (private, RLS-controlled)');
  };

  return {
    ensurePdfBucketExists
  };
};
