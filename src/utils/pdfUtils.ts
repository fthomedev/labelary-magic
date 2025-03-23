
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // First, normalize newlines and replace any Windows-style \r\n with just \n
  const normalizedZpl = zpl.replace(/\r\n/g, '\n');
  
  // Look for ZPL blocks - text starting with ^XA and ending with ^XZ
  const regex = /\^XA[\s\S]*?\^XZ/g;
  const matches = normalizedZpl.match(regex) || [];
  
  console.log(`Found ${matches.length} ZPL blocks in content`);
  
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
  
  try {
    console.log(`Starting to merge ${pdfBlobs.length} PDFs`);
    
    // Filter out any empty or invalid PDFs
    const validPdfBlobs = pdfBlobs.filter(blob => blob.size > 100);
    
    if (validPdfBlobs.length === 0) {
      throw new Error("No valid PDFs to merge");
    }
    
    if (validPdfBlobs.length === 1) {
      return validPdfBlobs[0];
    }
    
    const merger = new PDFMerger();
    
    // Process each PDF
    for (let i = 0; i < validPdfBlobs.length; i++) {
      try {
        const blob = validPdfBlobs[i];
        console.log(`Adding PDF ${i+1}/${validPdfBlobs.length} (${blob.size} bytes) to merger`);
        
        const arrayBuffer = await blob.arrayBuffer();
        
        // Skip empty PDFs
        if (arrayBuffer.byteLength < 100) {
          console.warn(`Skipping PDF ${i+1} because it's too small (${arrayBuffer.byteLength} bytes)`);
          continue;
        }
        
        await merger.add(arrayBuffer);
        console.log(`Added PDF ${i+1} successfully`);
      } catch (error) {
        console.error(`Error adding PDF ${i+1} to merger:`, error);
        // Continue with other PDFs rather than failing completely
      }
    }
    
    console.log('Saving merged PDF buffer');
    const mergedBuffer = await merger.saveAsBuffer();
    console.log(`Merged PDF buffer created: ${mergedBuffer.byteLength} bytes`);
    
    return new Blob([mergedBuffer], { type: 'application/pdf' });
  } catch (error) {
    console.error('Error in mergePDFs function:', error);
    
    // If merging fails, return the first valid PDF as fallback
    const validPdf = pdfBlobs.find(blob => blob.size > 100);
    if (validPdf) {
      console.log('Returning the first valid PDF as fallback');
      return validPdf;
    }
    
    throw error;
  }
};
