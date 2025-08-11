
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useToast } from '@/components/ui/use-toast';
import { mergePDFs } from '@/utils/pdfUtils';

export const usePdfOperations = () => {
  const [pdfUrls, setPdfUrls] = useState<string[]>([]);
  const [lastPdfUrl, setLastPdfUrl] = useState<string | undefined>(undefined);
  const [lastPdfPath, setLastPdfPath] = useState<string | undefined>(undefined);
  const { toast } = useToast();
  const { t } = useTranslation();

  const processPdfs = async (
    pdfs: Blob[],
    onProgress: (progress: number) => void
  ) => {
    // Create temporary blob URLs for the current session
    const newPdfUrls: string[] = [];
    pdfs.forEach(blob => {
      const blockUrl = window.URL.createObjectURL(blob);
      newPdfUrls.push(blockUrl);
    });
    setPdfUrls(newPdfUrls);

    if (pdfs.length === 0) {
      throw new Error("No PDFs were generated successfully.");
    }

    onProgress(85);
    const mergeStartTime = Date.now();
    
    console.log(`🔄 Starting PDF merge of ${pdfs.length} files...`);
    const mergedPdf = await mergePDFs(pdfs);
    
    const mergeTime = Date.now() - mergeStartTime;
    console.log(`✅ PDF merge completed in ${mergeTime}ms (${mergedPdf.size} bytes)`);
    
    onProgress(90);
    
    onProgress(95);
    const uploadTime = 0;
    const blobUrl = window.URL.createObjectURL(mergedPdf);
    setLastPdfUrl(blobUrl);
    setLastPdfPath(undefined);
    
    return { pdfPath: undefined, blobUrl, mergeTime, uploadTime };
  };

  const downloadPdf = (blobUrl: string, filename: string = 'etiquetas.pdf') => {
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return {
    pdfUrls,
    setPdfUrls,
    lastPdfUrl,
    lastPdfPath,
    setLastPdfUrl,
    setLastPdfPath,
    processPdfs,
    downloadPdf
  };
};
