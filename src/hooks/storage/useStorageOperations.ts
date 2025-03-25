
import { supabase } from '@/integrations/supabase/client';

export const useStorageOperations = () => {
  const ensurePdfBucketExists = async () => {
    try {
      const { error: bucketError } = await supabase.storage.getBucket('pdfs');
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        await supabase.storage.createBucket('pdfs', {
          public: true,
          fileSizeLimit: 10485760 // 10MB
        });
        
        await supabase.storage.updateBucket('pdfs', {
          public: true
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
