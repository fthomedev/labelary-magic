
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useUploadPdf = () => {
  const uploadPDFToStorage = async (pdfBlob: Blob, retryAttempt = 0): Promise<string> => {
    const MAX_RETRIES = 2;
    
    try {
      // Force session refresh to prevent expired token errors
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('Session refresh failed, trying getUser:', refreshError.message);
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const fileName = `label-${uuidv4()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      
      const { data, error } = await supabase.storage
        .from('pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        const errorMsg = error.message || '';
        
        // Detect HTML response (Supabase returning error page)
        if (errorMsg.includes('Unexpected token') || errorMsg.includes('<html')) {
          if (retryAttempt < MAX_RETRIES) {
            console.warn(`⚠️ Storage returned HTML error, retrying (${retryAttempt + 1}/${MAX_RETRIES})...`);
            await delay(3000 * (retryAttempt + 1));
            return uploadPDFToStorage(pdfBlob, retryAttempt + 1);
          }
        }
        
        // Retry on auth errors
        if ((errorMsg.includes('not authenticated') || errorMsg.includes('JWT')) && retryAttempt < MAX_RETRIES) {
          console.warn(`⚠️ Auth error during upload, retrying (${retryAttempt + 1}/${MAX_RETRIES})...`);
          await delay(2000);
          return uploadPDFToStorage(pdfBlob, retryAttempt + 1);
        }
        
        console.error('Error uploading PDF to storage:', error);
        throw error;
      }
      
      console.log('PDF uploaded to storage:', filePath);
      return filePath;
    } catch (error) {
      // Retry generic fetch failures
      if (error instanceof TypeError && error.message === 'Failed to fetch' && retryAttempt < MAX_RETRIES) {
        console.warn(`⚠️ Network error during upload, retrying (${retryAttempt + 1}/${MAX_RETRIES})...`);
        await delay(3000 * (retryAttempt + 1));
        return uploadPDFToStorage(pdfBlob, retryAttempt + 1);
      }
      
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
