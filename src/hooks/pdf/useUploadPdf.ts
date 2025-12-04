
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

export const useUploadPdf = () => {
  const uploadPDFToStorage = async (pdfBlob: Blob): Promise<string> => {
    try {
      // Get current user for folder-based storage (required for RLS policies)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const fileName = `label-${uuidv4()}.pdf`;
      // Store files in user-specific folder for RLS policy compliance
      const filePath = `${user.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading PDF to storage:', error);
        throw error;
      }
      
      console.log('PDF uploaded to storage:', filePath);
      return filePath;
    } catch (error) {
      console.error('Failed to upload PDF to storage:', error);
      throw error;
    }
  };

  const getPdfPublicUrl = async (pdfPath: string): Promise<string> => {
    const { data: publicUrlData } = await supabase.storage
      .from('pdfs')
      .getPublicUrl(pdfPath);
        
    if (!publicUrlData || !publicUrlData.publicUrl) {
      console.error('Failed to get public URL for PDF');
      throw new Error('Failed to get public URL for PDF');
    }
      
    return publicUrlData.publicUrl;
  };

  return {
    uploadPDFToStorage,
    getPdfPublicUrl
  };
};
