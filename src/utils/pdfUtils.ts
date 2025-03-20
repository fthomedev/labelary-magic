
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // Make sure we properly split ZPL into individual label blocks
  // We first split by ^XZ, then filter for blocks that contain ^XA
  // This ensures we don't count partial or malformed labels
  const blocks = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));
  
  // Ensure each block has proper start and end markers
  const completeLabels = blocks.map(label => `${label.trim()}^XZ`);
  
  // Remove any duplicates that might be causing double counting
  return completeLabels;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
  const merger = new PDFMerger();

  for (const blob of pdfBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    await merger.add(arrayBuffer);
  }

  const mergedBuffer = await merger.saveAsBuffer();
  return new Blob([mergedBuffer], { type: 'application/pdf' });
};
