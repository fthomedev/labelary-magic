
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  console.log('=== SPLITTING ZPL INTO BLOCKS ===');
  console.log('Original ZPL length:', zpl.length);
  console.log('ZPL preview (first 500 chars):', zpl.substring(0, 500));
  
  // Limpar ZPL
  const cleanZpl = zpl.trim();
  
  // Dividir por ^XZ e filtrar blocos válidos
  const rawBlocks = cleanZpl.split('^XZ');
  console.log('Raw blocks after split by ^XZ:', rawBlocks.length);
  
  const labels: string[] = [];
  
  for (let i = 0; i < rawBlocks.length; i++) {
    const block = rawBlocks[i].trim();
    
    // Pular blocos vazios
    if (!block) {
      console.log(`Skipping empty block ${i}`);
      continue;
    }
    
    // Verificar se contém ^XA
    if (block.includes('^XA')) {
      // Garantir que termina com ^XZ
      const completeLabel = block.endsWith('^XZ') ? block : `${block}^XZ`;
      labels.push(completeLabel);
      console.log(`Label ${labels.length}: length=${completeLabel.length}`);
      console.log(`Label ${labels.length} preview: ${completeLabel.substring(0, 100)}...`);
    } else {
      console.log(`Block ${i} doesn't contain ^XA, skipping:`, block.substring(0, 100));
    }
  }
  
  console.log('=== ZPL SPLITTING COMPLETED ===');
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
