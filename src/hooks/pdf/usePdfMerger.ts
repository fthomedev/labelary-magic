
import pdfMerger from 'pdf-merger-js';

export const usePdfMerger = () => {
  const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
    try {
      const merger = new pdfMerger();
      
      // Add each PDF blob to the merger
      for (const blob of pdfBlobs) {
        await merger.add(blob);
      }
      
      // Get the merged PDF as a buffer
      const mergedPdfBuffer = await merger.saveAsBuffer();
      
      // Convert buffer to blob
      const mergedBlob = new Blob([mergedPdfBuffer], { type: 'application/pdf' });
      
      return mergedBlob;
    } catch (error) {
      console.error('Error merging PDFs:', error);
      throw new Error('Failed to merge PDFs');
    }
  };

  return {
    mergePDFs
  };
};
