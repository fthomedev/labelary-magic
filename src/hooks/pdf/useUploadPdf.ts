
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '@/integrations/supabase/client';

/** Storage rejects objects above ~50 MB; keep a safety margin. */
export const MAX_PDF_UPLOAD_BYTES = 45 * 1024 * 1024;

export class PdfTooLargeError extends Error {
  readonly sizeBytes: number;
  constructor(sizeBytes: number) {
    super(`PDF too large for storage: ${sizeBytes} bytes (limit ${MAX_PDF_UPLOAD_BYTES})`);
    this.name = 'PdfTooLargeError';
    this.sizeBytes = sizeBytes;
  }
}

export const useUploadPdf = () => {
  const uploadPDFToStorage = async (pdfBlob: Blob): Promise<string> => {
    try {
      if (pdfBlob.size > MAX_PDF_UPLOAD_BYTES) {
        console.error(`🚫 PDF too large to upload: ${(pdfBlob.size / 1024 / 1024).toFixed(1)} MB`);
        throw new PdfTooLargeError(pdfBlob.size);
      }

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
