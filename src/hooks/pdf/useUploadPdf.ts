
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
      const sizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`📦 PDF size before upload: ${sizeMB}MB (${pdfBlob.size} bytes)`);
      
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        console.error('Error uploading PDF to storage:', error);
        if (error.message?.includes('exceeded') || error.message?.includes('maximum allowed size') || error.message?.includes('too large')) {
          throw new Error(`PDF muito grande para upload (${sizeMB}MB). Limite: 50MB.`);
        }
        throw error;
      }
      
      console.log('PDF uploaded to storage:', filePath);
      return filePath;
    } catch (error) {
      console.error('Failed to upload PDF to storage:', error);
      throw error;
    }
  };

  const getPdfSignedUrl = async (pdfPath: string, expiresIn: number = 3600): Promise<string> => {
    const { data, error } = await supabase.storage
      .from('pdfs')
      .createSignedUrl(pdfPath, expiresIn);
        
    if (error || !data?.signedUrl) {
      console.error('Failed to get signed URL for PDF:', error);
      throw new Error('Failed to get signed URL for PDF');
    }
      
    return data.signedUrl;
  };

  return {
    uploadPDFToStorage,
    getPdfSignedUrl
  };
};
