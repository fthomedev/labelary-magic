/**
 * Centralized ZPL utility functions for label counting and parsing.
 * This is the SINGLE SOURCE OF TRUTH for ZPL label counting logic.
 * 
 * IMPORTANT: Each ZPL label has 2 ^XA markers, so we divide by 2 to get the correct count.
 * This applies to all conversion modes (Standard, A4, HD).
 */

import { splitZPLIntoBlocks } from './pdfUtils';

const LABELARY_MAX_LABELS = 50;

/**
 * Extract the ^PQ (Print Quantity) value from a ZPL block.
 * ^PQ command format: ^PQq,p,r,o where q = quantity (1-99999999)
 * Returns 1 if no ^PQ found.
 */
export const extractPrintQuantity = (zplBlock: string): number => {
  const match = zplBlock.match(/\^PQ(\d+)/i);
  if (!match) return 1;
  const qty = parseInt(match[1], 10);
  return isNaN(qty) || qty < 1 ? 1 : qty;
};

/**
 * Count the effective number of labels considering ^PQ commands.
 * Each block's print quantity is summed.
 */
export const countZplLabels = (zplContent: string): number => {
  const blocks = splitZPLIntoBlocks(zplContent);
  const pairedBlocks = Math.ceil(blocks.length / 2);
  // Sum ^PQ quantities across paired labels
  let totalLabels = 0;
  for (let i = 0; i < blocks.length; i += 2) {
    const qty = extractPrintQuantity(blocks[i]);
    totalLabels += qty;
  }
  return totalLabels || pairedBlocks;
};

/**
 * Count labels with logging for debugging purposes.
 */
export const countZplLabelsWithLog = (zplContent: string, context?: string): number => {
  const blocks = splitZPLIntoBlocks(zplContent);
  const pairedBlocks = Math.ceil(blocks.length / 2);
  let totalEffective = 0;
  let hasPQ = false;
  for (let i = 0; i < blocks.length; i += 2) {
    const qty = extractPrintQuantity(blocks[i]);
    if (qty > 1) hasPQ = true;
    totalEffective += qty;
  }
  const labelCount = totalEffective || pairedBlocks;
  const prefix = context ? `[${context}] ` : '';
  console.log(`🔢 ${prefix}Counted ${labelCount} labels (${blocks.length} blocks, ${pairedBlocks} pairs${hasPQ ? `, ^PQ detected` : ''})`);
  return labelCount;
};

/**
 * Parse ZPL content into individual label blocks.
 */
export const parseZplBlocks = (zplContent: string): string[] => {
  return splitZPLIntoBlocks(zplContent);
};

/**
 * Calculate the maximum batch size for a set of labels,
 * considering ^PQ commands to stay under the Labelary API limit.
 */
export const calculateSafeBatchSize = (labels: string[], defaultBatchSize: number): number => {
  // Find the max ^PQ in any label
  let maxPQ = 1;
  for (let i = 0; i < labels.length; i++) {
    const qty = extractPrintQuantity(labels[i]);
    if (qty > maxPQ) maxPQ = qty;
  }
  
  if (maxPQ <= 1) return defaultBatchSize;
  
  // Each label in the batch produces `qty` copies, so limit batch to floor(50/maxPQ)
  const safeBatch = Math.max(1, Math.floor(LABELARY_MAX_LABELS / maxPQ));
  const result = Math.min(defaultBatchSize, safeBatch);
  console.log(`⚠️ ^PQ=${maxPQ} detected, batch size reduced from ${defaultBatchSize} to ${result}`);
  return result;
};

/**
 * Parse ZPL content and return blocks, corrected label count, and safe batch size.
 */
export const parseZplWithCount = (zplContent: string): { blocks: string[]; labelCount: number; safeBatchSize?: number } => {
  const blocks = splitZPLIntoBlocks(zplContent);
  let totalEffective = 0;
  let maxPQ = 1;
  for (let i = 0; i < blocks.length; i += 2) {
    const qty = extractPrintQuantity(blocks[i]);
    if (qty > maxPQ) maxPQ = qty;
    totalEffective += qty;
  }
  const labelCount = totalEffective || Math.ceil(blocks.length / 2);
  const safeBatchSize = maxPQ > 1 ? Math.max(1, Math.floor(LABELARY_MAX_LABELS / maxPQ)) : undefined;
  return { blocks, labelCount, safeBatchSize };
};
