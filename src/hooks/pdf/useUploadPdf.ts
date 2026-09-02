
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

/**
 * Long conversions can outlive the access token. Refresh it proactively so the
 * upload never fails with "User not authenticated".
 */
const ensureFreshSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();

  const expiresAt = session?.expires_at ? session.expires_at * 1000 : 0;
  const expiringSoon = expiresAt > 0 && expiresAt - Date.now() < 120_000;

  if (!session || expiringSoon) {
    console.log('🔄 Refreshing Supabase session before upload...');
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session?.user) return refreshed.session.user;
  }

  if (session?.user) return session.user;

  const { data: { user } } = await supabase.auth.getUser();
  return user ?? null;
};

const buildFilePath = (userId: string) =>
  `${userId}/label-${Date.now()}-${uuidv4()}.pdf`;

export const useUploadPdf = () => {
  const uploadPDFToStorage = async (pdfBlob: Blob): Promise<string> => {
    try {
      if (pdfBlob.size > MAX_PDF_UPLOAD_BYTES) {
        console.error(`🚫 PDF too large to upload: ${(pdfBlob.size / 1024 / 1024).toFixed(1)} MB`);
        throw new PdfTooLargeError(pdfBlob.size);
      }

      // Get current user for folder-based storage (required for RLS policies)
      const user = await ensureFreshSession();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Retry with a brand-new path on the (rare) name collision → no more 409s,
      // and retry transient network failures ("Failed to fetch") with backoff.
      let lastError: unknown = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const filePath = buildFilePath(user.id);

        let error: unknown = null;
        try {
          const result = await supabase.storage
            .from('pdfs')
            .upload(filePath, pdfBlob, {
              contentType: 'application/pdf',
              cacheControl: '3600',
              upsert: false,
            });
          error = result.error;
        } catch (networkError) {
          error = networkError;
        }

        if (!error) {
          console.log('PDF uploaded to storage:', filePath);
          return filePath;
        }

        lastError = error;
        const message = (error as { message?: string }).message ?? '';
        const isDuplicate = /duplicate|already exists/i.test(message);
        const isNetwork = /failed to fetch|networkerror|network request failed|load failed/i.test(message);
        if (!isDuplicate && !isNetwork) break;

        if (isNetwork) {
          const wait = 1500 * Math.pow(2, attempt);
          console.warn(`🌐 Falha de rede no upload, tentando de novo em ${wait}ms (tentativa ${attempt + 1})`);
          await new Promise(resolve => setTimeout(resolve, wait));
        } else {
          console.warn(`⚠️ Storage path collision, retrying with a new name (attempt ${attempt + 1})`);
        }
      }

      console.error('Error uploading PDF to storage:', lastError);
      throw lastError;
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
