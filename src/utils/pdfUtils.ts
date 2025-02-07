
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  const labels = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));
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

  const mergedPdf = await merger.save();
  const mergedArrayBuffer = await mergedPdf.arrayBuffer();
  return new Blob([mergedArrayBuffer], { type: 'application/pdf' });
};
