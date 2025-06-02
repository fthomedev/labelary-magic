
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  console.log('=== SPLITTING ZPL INTO BLOCKS ===');
  console.log('Original ZPL length:', zpl.length);
  console.log('ZPL preview (first 500 chars):', zpl.substring(0, 500));
  
  // Limpar ZPL removendo quebras de linha e espaços extras
  const cleanZpl = zpl.replace(/[\r\n\t]/g, '').replace(/\s+/g, ' ').trim();
  console.log('Cleaned ZPL length:', cleanZpl.length);
  
  const labels: string[] = [];
  
  // Método principal: procurar por padrões ^XA...^XZ
  const xaPattern = /\^XA.*?\^XZ/g;
  let match;
  
  while ((match = xaPattern.exec(cleanZpl)) !== null) {
    const label = match[0];
    if (label && label.length > 6) { // Mínimo ^XA + ^XZ = 6 chars
      labels.push(label);
      console.log(`Found label ${labels.length}: ${label.substring(0, 50)}...`);
    }
  }
  
  // Se não encontrou nenhuma label com o método principal, tentar método alternativo
  if (labels.length === 0) {
    console.log('Primary method found no labels, trying alternative method...');
    
    // Dividir por ^XZ e reconstruir
    const parts = cleanZpl.split('^XZ');
    for (let i = 0; i < parts.length - 1; i++) {
      let part = parts[i].trim();
      
      // Encontrar o último ^XA na parte
      const lastXAIndex = part.lastIndexOf('^XA');
      if (lastXAIndex !== -1) {
        part = part.substring(lastXAIndex);
        const completeLabel = `${part}^XZ`;
        
        if (completeLabel.length > 6) {
          labels.push(completeLabel);
          console.log(`Alternative method found label ${labels.length}: ${completeLabel.substring(0, 50)}...`);
        }
      }
    }
  }
  
  console.log('=== ZPL SPLITTING COMPLETED ===');
  console.log('Total labels extracted:', labels.length);
  
  // Log das primeiras labels para debug
  labels.slice(0, 3).forEach((label, index) => {
    console.log(`Label ${index + 1} sample:`, label.substring(0, 100));
  });
  
  return labels;
};

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mergePDFs = async (pdfBlobs: Blob[]): Promise<Blob> => {
  console.log('=== MERGING PDFs ===');
  console.log('PDFs to merge:', pdfBlobs.length);
  
  if (pdfBlobs.length === 0) {
    throw new Error('No PDFs to merge');
  }
  
  if (pdfBlobs.length === 1) {
    console.log('Only one PDF, returning as is');
    return pdfBlobs[0];
  }
  
  const merger = new PDFMerger();
  
  for (let i = 0; i < pdfBlobs.length; i++) {
    const blob = pdfBlobs[i];
    console.log(`Adding PDF ${i + 1} to merger, size: ${blob.size} bytes`);
    
    if (blob.size === 0) {
      console.warn(`PDF ${i + 1} is empty, skipping`);
      continue;
    }
    
    try {
      const arrayBuffer = await blob.arrayBuffer();
      await merger.add(arrayBuffer);
      console.log(`Successfully added PDF ${i + 1} to merger`);
    } catch (error) {
      console.error(`Error adding PDF ${i + 1} to merger:`, error);
      throw new Error(`Failed to add PDF ${i + 1} to merger: ${error.message}`);
    }
  }

  try {
    const mergedBuffer = await merger.saveAsBuffer();
    const mergedBlob = new Blob([mergedBuffer], { type: 'application/pdf' });
    console.log('=== MERGE COMPLETED ===');
    console.log('Final merged PDF size:', mergedBlob.size, 'bytes');
    return mergedBlob;
  } catch (error) {
    console.error('Error saving merged PDF:', error);
    throw new Error(`Failed to save merged PDF: ${error.message}`);
  }
};
