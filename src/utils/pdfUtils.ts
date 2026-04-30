
import PDFMerger from 'pdf-merger-js';

/**
 * Split ZPL content into individual label blocks.
 *
 * Handles two main formats:
 *  - Shopee/ML: each logical label uses 2 ^XA...^XZ blocks (no ^PQ).
 *  - TikTok / others: each logical label uses 1 ^XA...^XZ block plus
 *    a ^PQ<n>,... command meaning "print this label N times".
 *
 * For ^PQ<n> with n > 1, the block is replicated N times in the output array
 * and the ^PQ is rewritten to ^PQ1 to avoid double-printing on the server side.
 */
export const splitZPLIntoBlocks = (zpl: string): string[] => {
  // Split by end marker ^XZ and filter for blocks that contain start marker ^XA
  const rawLabels = zpl.split('^XZ').filter(label => label.trim().includes('^XA'));

  const expanded: string[] = [];
  for (const raw of rawLabels) {
    const block = `${raw.trim()}^XZ`;

    // Look for ^PQ<n>[,...] — only the first ^PQ matters per label
    const pqMatch = block.match(/\^PQ(\d+)([^\^]*)/);
    const quantity = pqMatch ? Math.max(1, parseInt(pqMatch[1], 10) || 1) : 1;

    if (quantity > 1 && pqMatch) {
      // Rewrite ^PQ<n>,... to ^PQ1,... so the printer/Labelary doesn't multiply again
      const normalized = block.replace(/\^PQ\d+/, '^PQ1');
      for (let i = 0; i < quantity; i++) {
        expanded.push(normalized);
      }
    } else {
      expanded.push(block);
    }
  }

  return expanded;
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
