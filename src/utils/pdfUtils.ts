
import PDFMerger from 'pdf-merger-js';
import jsPDF from 'jspdf';

const blobToDataURL = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const convertImagesToPdf = async (imageBlobs: Blob[]): Promise<Blob> => {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'in',
    format: [4, 6] // 4x6 inches label size
  });

  for (let i = 0; i < imageBlobs.length; i++) {
    if (i > 0) pdf.addPage([4, 6], 'portrait');
    
    const imageDataUrl = await blobToDataURL(imageBlobs[i]);
    pdf.addImage(imageDataUrl, 'PNG', 0, 0, 4, 6);
  }

  return pdf.output('blob');
};

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
