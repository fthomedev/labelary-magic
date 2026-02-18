
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;

const isPermanentError = (error: any): boolean => {
  const msg = error?.message || '';
  return (
    msg.includes('exceeded') ||
    msg.includes('maximum allowed size') ||
    msg.includes('too large') ||
    msg.includes('401') ||
    msg.includes('403') ||
    msg.includes('not authenticated') ||
    msg.includes('Unauthorized')
  );
};

const isTransientError = (error: any): boolean => {
  const msg = error?.message || '';
  return (
    msg.includes('<html') ||
    msg.includes('<!DOCTYPE') ||
    msg.includes('is not valid JSON') ||
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('NetworkError') ||
    msg.includes('Failed to fetch') ||
    msg.includes('500') ||
    msg.includes('502') ||
    msg.includes('503') ||
    msg.includes('504') ||
    msg.includes('ECONNRESET') ||
    msg.includes('timeout')
  );
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const useUploadPdf = () => {
  const uploadWithRetry = async (filePath: string, pdfBlob: Blob, sizeMB: string): Promise<void> => {
    let lastError: any;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt > 1) {
        // Refresh auth session before retry
        await supabase.auth.getSession();
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 2); // 1s, 2s
        console.log(`🔄 Upload retry ${attempt}/${MAX_RETRIES} after ${delay}ms...`);
        await sleep(delay);
      }

      const { error } = await supabase.storage
        .from('pdfs')
        .upload(filePath, pdfBlob, {
          contentType: 'application/pdf',
          cacheControl: '3600',
          upsert: false,
        });

      if (!error) {
        if (attempt > 1) {
          console.log(`✅ Upload succeeded on attempt ${attempt}`);
        }
        return;
      }

      lastError = error;
      console.warn(`⚠️ Upload attempt ${attempt}/${MAX_RETRIES} failed:`, error.message);

      // Don't retry permanent errors
      if (isPermanentError(error)) {
        if (error.message?.includes('exceeded') || error.message?.includes('maximum allowed size') || error.message?.includes('too large')) {
          throw new Error(`PDF muito grande para upload (${sizeMB}MB). Limite: 50MB.`);
        }
        throw error;
      }

      // Only retry transient errors
      if (!isTransientError(error) && attempt < MAX_RETRIES) {
        console.warn(`❓ Unknown error type, retrying anyway:`, error.message);
      }
    }

    // All retries exhausted
    console.error(`❌ Upload failed after ${MAX_RETRIES} attempts`);
    throw lastError;
  };

  const uploadPDFToStorage = async (pdfBlob: Blob): Promise<string> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      const fileName = `label-${uuidv4()}.pdf`;
      const filePath = `${user.id}/${fileName}`;
      const sizeMB = (pdfBlob.size / (1024 * 1024)).toFixed(2);
      console.log(`📦 PDF size before upload: ${sizeMB}MB (${pdfBlob.size} bytes)`);
      
      await uploadWithRetry(filePath, pdfBlob, sizeMB);
      
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
