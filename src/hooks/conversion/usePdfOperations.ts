
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { mergePDFs } from '@/utils/pdfUtils';
import { useUploadPdf } from '@/hooks/pdf/useUploadPdf';
import { useStorageOperations } from '@/hooks/storage/useStorageOperations';
import { reportProcessingError, ProcessingErrorPayload } from '@/lib/errorLogging';

export type PdfLogContext = Pick<
  ProcessingErrorPayload,
  'processingType' | 'labelCountAttempted' | 'zplFormat' | 'labelSize' | 'twoColumn' | 'hasImages'
>;

export const usePdfOperations = () => {
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | undefined>(undefined);
  const [lastPdfPath, setLastPdfPath] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { t } = useTranslation();
  const { uploadPDFToStorage } = useUploadPdf();
  const { ensurePdfBucketExists } = useStorageOperations();

  const processPdfs = async (
    pdfs: Blob[],
    onProgress: (progress: number) => void,
    logContext: PdfLogContext = {}
  ) => {
    // Create temporary blob URLs for the current session
    const newPdfUrls: string[] = [];
    pdfs.forEach(blob => {
      const blockUrl = window.URL.createObjectURL(blob);
      newPdfUrls.push(blockUrl);
    });
    setPdfUrls(newPdfUrls);

    if (pdfs.length === 0) {
      reportProcessingError({
        ...logContext,
        errorType: 'zpl_parse_empty',
        message: 'Nenhum PDF foi gerado com sucesso (0 lotes válidos)',
      });
      throw new Error("No PDFs were generated successfully.");
    }

    onProgress(85);
    const mergeStartTime = Date.now();

    console.log(`🔄 Starting PDF merge of ${pdfs.length} files...`);
    let mergedPdf: Blob;
    try {
      mergedPdf = await mergePDFs(pdfs);
    } catch (mergeError) {
      reportProcessingError({
        ...logContext,
        errorType: 'pdf_merge_failed',
        error: mergeError,
        processingTimeMs: Date.now() - mergeStartTime,
        metadata: { pdfParts: pdfs.length },
      });
      throw mergeError;
    }

    const mergeTime = Date.now() - mergeStartTime;
    console.log(`✅ PDF merge completed in ${mergeTime}ms (${mergedPdf.size} bytes)`);

    onProgress(90);

    onProgress(95);
    const uploadStartTime = Date.now();

    // Upload PDF to storage
    let pdfPath: string;
    try {
      // Ensure bucket exists
      await ensurePdfBucketExists();
      pdfPath = await uploadPDFToStorage(mergedPdf);
    } catch (uploadError) {
      reportProcessingError({
        ...logContext,
        errorType: 'storage_upload_failed',
        error: uploadError,
        processingTimeMs: Date.now() - uploadStartTime,
        metadata: { pdfSizeBytes: mergedPdf.size },
      });
      throw uploadError;
    }
    const uploadTime = Date.now() - uploadStartTime;
    console.log(`☁️ PDF upload completed in ${uploadTime}ms:`, pdfPath);
    setLastPdfPath(pdfPath);

    // Get the temporary blob URL for the current session
    const blobUrl = window.URL.createObjectURL(mergedPdf);
    setLastPdfUrl(blobUrl);

    return { pdfPath, blobUrl, mergeTime, uploadTime };
  };


  const downloadPdf = (blobUrl: string, filename: string = 'etiquetas.pdf') => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const resetPdfState = () => {
    setPdfUrls([]);
    setLastPdfUrl(undefined);
    setLastPdfPath(undefined);
  };

  return {
    pdfUrls,
    setPdfUrls,
    lastPdfUrl,
    lastPdfPath,
    setLastPdfUrl,
    setLastPdfPath,
    processPdfs,
    downloadPdf,
    resetPdfState
  };
};
