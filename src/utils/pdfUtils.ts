
import PDFMerger from 'pdf-merger-js';

export const splitZPLIntoBlocks = (zpl: string): string[] => {
  console.log('=== SPLITTING ZPL INTO BLOCKS ===');
  console.log('Original ZPL length:', zpl.length);
  console.log('ZPL preview (first 500 chars):', zpl.substring(0, 500));
  
  // Limpar ZPL
  const cleanZpl = zpl.trim();
  
  // Contar ^XA para verificar quantas etiquetas esperamos
  const expectedLabels = (cleanZpl.match(/\^XA/g) || []).length;
  console.log('Expected labels based on ^XA count:', expectedLabels);
  
  // Método mais robusto: dividir por ^XA e reconstruir cada etiqueta
  const blocks = cleanZpl.split(/\^XA/);
  console.log('Blocks after split by ^XA:', blocks.length);
  
  const labels: string[] = [];
  
  // O primeiro bloco geralmente está vazio, então começamos do índice 1
  for (let i = 1; i < blocks.length; i++) {
    let block = blocks[i].trim();
    
    // Pular blocos vazios
    if (!block) {
      console.log(`Skipping empty block ${i}`);
      continue;
    }
    
    // Garantir que a etiqueta comece com ^XA e termine com ^XZ
    let completeLabel = '^XA' + block;
    
    // Se não termina com ^XZ, adicionar
    if (!completeLabel.endsWith('^XZ')) {
      // Verificar se há ^XZ em algum lugar e cortar após ele
      const xzIndex = completeLabel.indexOf('^XZ');
      if (xzIndex !== -1) {
        completeLabel = completeLabel.substring(0, xzIndex + 3);
      } else {
        completeLabel = completeLabel + '^XZ';
      }
    }
    
    // Limpar possíveis ^XZ duplicados
    completeLabel = completeLabel.replace(/\^XZ\^XZ/g, '^XZ');
    
    labels.push(completeLabel);
    console.log(`Label ${labels.length}: length=${completeLabel.length}`);
    console.log(`Label ${labels.length} preview: ${completeLabel.substring(0, 150)}...`);
  }
  
  console.log('=== ZPL SPLITTING COMPLETED ===');
  console.log('Final processed labels count:', labels.length);
  console.log('Expected vs Actual:', expectedLabels, 'vs', labels.length);
  
  // Se não conseguimos extrair etiquetas suficientes, tentar método alternativo
  if (labels.length < expectedLabels * 0.8) {
    console.log('WARNING: Label count mismatch, trying alternative method...');
    return splitZPLAlternativeMethod(cleanZpl);
  }
  
  return labels;
};

// Método alternativo de divisão mais agressivo
const splitZPLAlternativeMethod = (zpl: string): string[] => {
  console.log('=== USING ALTERNATIVE SPLITTING METHOD ===');
  
  const labels: string[] = [];
  const regex = /\^XA.*?\^XZ/gs;
  let match;
  
  while ((match = regex.exec(zpl)) !== null) {
    const label = match[0].trim();
    if (label && label.length > 10) {
      labels.push(label);
      console.log(`Alternative method - Label ${labels.length}: ${label.substring(0, 100)}...`);
    }
  }
  
  console.log('Alternative method extracted labels:', labels.length);
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
