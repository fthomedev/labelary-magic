
import { supabase } from '@/integrations/supabase/client';

export const useStorageOperations = () => {
  const ensurePdfBucketExists = async () => {
    try {
      const { error: bucketError } = await supabase.storage.getBucket('pdfs');
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        // Create bucket as private for security - RLS policies handle access
        await supabase.storage.createBucket('pdfs', {
          public: false,
          fileSizeLimit: 10485760 // 10MB
        });
      }
    } catch (bucketError) {
      console.error('Error with bucket operations:', bucketError);
    }
  };

  return {
    ensurePdfBucketExists
  };
};
