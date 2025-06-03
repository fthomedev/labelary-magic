
import { supabase } from '@/integrations/supabase/client';

export const uploadPngToStorage = async (pngBlob: Blob, fileName: string): Promise<string> => {
  try {
    // Ensure PNG bucket exists
    const { error: bucketError } = await supabase.storage.getBucket('pngs');
    if (bucketError && bucketError.message.includes('The resource was not found')) {
      await supabase.storage.createBucket('pngs', {
        public: true,
        fileSizeLimit: 5242880 // 5MB
      });
      console.log('📁 Created PNG bucket');
    }

    const { data, error } = await supabase.storage
      .from('pngs')
      .upload(fileName, pngBlob, {
        contentType: 'image/png',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('pngs')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Failed to upload PNG to storage:', error);
    throw error;
  }
};
