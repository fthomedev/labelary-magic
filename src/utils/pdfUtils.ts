
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // Split by end marker ^XZ and filter for blocks that contain start marker ^XA
  const labels = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));
  // Add back the end marker to each label
  const completeLabels = labels.map(label => `${label.trim()}^XZ`);
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
  return new Blob([new Uint8Array(mergedBuffer)], { type: 'application/pdf' });
};
