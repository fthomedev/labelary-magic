
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  console.log('Splitting ZPL into blocks, original length:', zpl.length);
  
  // Clean up the ZPL content
  const cleanZpl = zpl.trim();
  
  // Split by end marker ^XZ and filter for blocks that contain start marker ^XA
  const rawBlocks = cleanZpl.split('^XZ');
  console.log('Raw blocks after split by ^XZ:', rawBlocks.length);
  
  const labels: string[] = [];
  
  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    
    // Skip empty blocks
    if (!block) continue;
    
    // Check if block contains ^XA (start of label)
    if (block.includes('^XA')) {
      // Ensure the block ends with ^XZ
      const completeLabel = block.endsWith('^XZ') ? block : `${block}^XZ`;
      labels.push(completeLabel);
      console.log(`Label ${labels.length}: length=${completeLabel.length}, starts with: ${completeLabel.substring(0, 50)}`);
    }
  }
  
  console.log('Final processed labels count:', labels.length);
  return labels;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
  console.log('Merging PDFs, count:', pdfBlobs.length);
  const merger = new PDFMerger();

  for (const blob of pdfBlobs) {
    const arrayBuffer = await blob.arrayBuffer();
    await merger.add(arrayBuffer);
  }

  const mergedBuffer = await merger.saveAsBuffer();
  const mergedBlob = new Blob([mergedBuffer], { type: 'application/pdf' });
  console.log('Merged PDF size:', mergedBlob.size, 'bytes');
  return mergedBlob;
};
