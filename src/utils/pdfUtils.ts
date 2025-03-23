
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // First, normalize newlines and replace any Windows-style \r\n with just \n
  const normalizedZpl = zpl.replace(/\r\n/g, '\n');
  
  // Look for ZPL blocks - text starting with ^XA and ending with ^XZ
  const regex = /\^XA[\s\S]*?\^XZ/g;
  const matches = normalizedZpl.match(regex) || [];
  
  // Ensure each block is properly formatted and cleaned
  return matches.map(block => {
    // Remove extra whitespace and ensure proper format
    return block.trim();
  }).filter(block => block.length > 10); // Filter out too short blocks
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
  if (pdfBlobs.length === 0) {
    throw new Error("No PDFs to merge");
  }
  
  if (pdfBlobs.length === 1) {
    // If there's only one PDF, no need to merge
    return pdfBlobs[0];
  }
  
  const merger = new PDFMerger();

  for (const blob of pdfBlobs) {
    try {
      const arrayBuffer = await blob.arrayBuffer();
      await merger.add(arrayBuffer);
    } catch (error) {
      console.error('Error adding PDF to merger:', error);
      // Continue with other PDFs rather than failing completely
    }
  }

  const mergedBuffer = await merger.saveAsBuffer();
  return new Blob([mergedBuffer], { type: 'application/pdf' });
};
