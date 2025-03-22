
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  const regex = /\^XA[\s\S]*?\^XZ/g;
  const matches = zpl.match(regex) || [];
  
  // Garantir que cada bloco seja bem formado e limpo
  return matches.map(block => {
    // Remover espaços em branco extras e garantir formato adequado
    return block.trim();
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
