
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // Updated regex to match ^XA at the beginning of a line and ^XZ at the end of a line
  const regex = /(?:^|\n)\s*\^XA[\s\S]*?\^XZ\s*(?:\n|$)/g;
  const matches = zpl.match(regex) || [];
  
  // Clean up the matches to ensure they're valid ZPL blocks
  return matches.map(block => {
    // Trim whitespace and ensure the block starts with ^XA and ends with ^XZ
    const trimmed = block.trim();
    if (!trimmed.startsWith('^XA')) {
      return `^XA${trimmed}`;
    }
    if (!trimmed.endsWith('^XZ')) {
      return `${trimmed}^XZ`;
    }
    return trimmed;
  });
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
