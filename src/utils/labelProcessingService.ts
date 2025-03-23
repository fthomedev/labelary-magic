
import { splitZPLIntoBlocks, delay, mergePDFs } from './pdfUtils';
import { fetchZPLWithRetry } from './zplApiService';
import { addToProcessingHistory } from './processingHistoryService';

export type LabelProcessingCallbacks = {
  onProgress: (progress: number) => void;
  onComplete: (pdfUrl: string) => void;
  onError: (message: string) => void;
  getTranslation: (key: string, options?: any) => string;
};

/**
 * Processes ZPL content into PDF blocks
 */
export const processZPLContent = async (
  zplContent: string,
  callbacks: LabelProcessingCallbacks
): Promise<{pdfUrls: string[], lastPdfUrl?: string}> => {
  if (!zplContent || zplContent.trim() === '') {
    callbacks.onError(callbacks.getTranslation('noZplContent'));
    return { pdfUrls: [] };
  }
  
  try {
    // Split ZPL content into valid ZPL blocks
    const labels = splitZPLIntoBlocks(zplContent);
    console.log(`Total labels found: ${labels.length}`);
    
    if (labels.length === 0) {
      throw new Error(callbacks.getTranslation('noValidZplBlocks'));
    }
    
    const pdfs: Blob[] = [];
    const newPdfUrls: string[] = [];
    
    // Process strictly one label at a time to avoid API rate limits and improve reliability
    const LABELS_PER_REQUEST = 1;
    
    for (let i = 0; i < labels.length; i += LABELS_PER_REQUEST) {
      try {
        const blockLabels = labels.slice(i, i + LABELS_PER_REQUEST);
        const blockZPL = blockLabels.join('\n');
        
        console.log(`Processing label ${i + 1}/${labels.length}, ZPL size: ${blockZPL.length} chars`);
        
        // Validate ZPL format
        const validFormat = blockLabels.every(label => 
          label.trim().startsWith('^XA') && 
          label.trim().endsWith('^XZ') &&
          label.length > 10
        );
        
        if (!validFormat) {
          console.warn('Invalid ZPL block detected and skipped');
          continue;
        }

        // Use the retry function to handle rate limiting and errors
        const blob = await fetchZPLWithRetry(blockZPL);
        console.log(`PDF received for label ${i + 1}: ${blob.size} bytes`);
        
        // Additional validation for the returned PDF
        if (blob.size > 500) {
          pdfs.push(blob);
          const blockUrl = URL.createObjectURL(blob);
          newPdfUrls.push(blockUrl);
        } else {
          console.warn(`Skipping too small PDF for label ${i + 1} (${blob.size} bytes)`);
        }

        // Update progress
        callbacks.onProgress(((i + 1) / labels.length) * 100);

        // Add significant delay between requests to avoid rate limiting
        if (i + LABELS_PER_REQUEST < labels.length) {
          await delay(2000);
        }
      } catch (error) {
        console.error(`Error processing label ${i + 1}:`, error);
        
        // Show warning but continue with other labels
        callbacks.onError(callbacks.getTranslation('labelError', { label: i + 1 }));
        
        // Still update progress
        callbacks.onProgress(((i + 1) / labels.length) * 100);
        
        // Add extra delay after an error
        await delay(3000);
      }
    }
    
    if (pdfs.length > 0) {
      try {
        console.log(`Merging ${pdfs.length} PDFs`);
        const mergedPdf = await mergePDFs(pdfs);
        console.log(`Final PDF generated: ${mergedPdf.size} bytes`);
        
        if (mergedPdf.size < 1000) {
          throw new Error(callbacks.getTranslation('pdfInvalid'));
        }
        
        const finalUrl = URL.createObjectURL(mergedPdf);
        
        // Add to processing history
        const totalLabels = labels.length;
        await addToProcessingHistory(totalLabels, finalUrl);

        callbacks.onComplete(finalUrl);
        
        return { 
          pdfUrls: newPdfUrls,
          lastPdfUrl: finalUrl
        };
      } catch (error) {
        console.error('Error merging PDFs:', error);
        callbacks.onError(callbacks.getTranslation('mergePdfError'));
        return { pdfUrls: newPdfUrls };
      }
    } else {
      throw new Error(callbacks.getTranslation('noPdfsGenerated'));
    }
  } catch (error) {
    console.error('Conversion error:', error);
    callbacks.onError(error instanceof Error ? error.message : callbacks.getTranslation('errorMessage'));
    return { pdfUrls: [] };
  }
};
