/**
 * Centralized ZPL utility functions for label counting and parsing.
 * SINGLE SOURCE OF TRUTH for ZPL label counting logic.
 *
 * Supported formats:
 *  - Shopee / Mercado Livre: each logical label uses 2 ^XA...^XZ blocks,
 *    no ^PQ. Count = blocks / 2.
 *  - TikTok and similar: each logical label uses 1 ^XA...^XZ block plus
 *    ^PQ<n> meaning "print this label N times". splitZPLIntoBlocks already
 *    expands ^PQ, so count = expanded blocks length (no division by 2).
 */

import { splitZPLIntoBlocks } from './pdfUtils';

/**
 * Detect the ZPL format based on the raw content (before expansion).
 *  - 'tiktok'  → has at least one ^PQ<n> with n > 1, OR raw blocks are odd
 *               (one ^XA per label)
 *  - 'shopee'  → default (two ^XA per label, no ^PQ)
 */
export const detectZplFormat = (zplContent: string): 'tiktok' | 'shopee' => {
  // Look for ^PQ commands with quantity > 1
  const pqMatches = zplContent.match(/\^PQ(\d+)/g) || [];
  const hasPqMultiplier = pqMatches.some(m => {
    const n = parseInt(m.replace('^PQ', ''), 10);
    return n > 1;
  });
  if (hasPqMultiplier) return 'tiktok';

  // Fallback: count raw ^XA markers — odd count strongly suggests TikTok-style
  const rawXaCount = (zplContent.match(/\^XA/g) || []).length;
  if (rawXaCount > 0 && rawXaCount % 2 !== 0) return 'tiktok';

  return 'shopee';
};

/**
 * Compute the label count from already-expanded blocks based on the format.
 * Centralized so every caller stays consistent.
 */
const computeLabelCount = (
  expandedBlocks: string[],
  format: 'tiktok' | 'shopee'
): number => {
  if (format === 'tiktok') {
    // splitZPLIntoBlocks already replicated ^PQ blocks → 1 block = 1 label
    return expandedBlocks.length;
  }
  // Shopee/ML: each label uses 2 ^XA...^XZ blocks
  return Math.ceil(expandedBlocks.length / 2);
};

/**
 * Count the number of labels in ZPL content.
 */
export const countZplLabels = (zplContent: string): number => {
  const format = detectZplFormat(zplContent);
  const blocks = splitZPLIntoBlocks(zplContent);
  return computeLabelCount(blocks, format);
};

/**
 * Count labels with logging for debugging purposes.
 */
export const countZplLabelsWithLog = (zplContent: string, context?: string): number => {
  const format = detectZplFormat(zplContent);
  const blocks = splitZPLIntoBlocks(zplContent);
  const labelCount = computeLabelCount(blocks, format);
  const prefix = context ? `[${context}] ` : '';
  console.log(
    `🔢 ${prefix}Counted ${labelCount} labels (${blocks.length} expanded blocks, format=${format})`
  );
  return labelCount;
};

/**
 * Parse ZPL content into individual label blocks (already expanded for ^PQ).
 */
export const parseZplBlocks = (zplContent: string): string[] => {
  return splitZPLIntoBlocks(zplContent);
};

/**
 * Parse ZPL content and return both expanded blocks and the corrected count.
 */
export const parseZplWithCount = (
  zplContent: string
): { blocks: string[]; labelCount: number } => {
  const format = detectZplFormat(zplContent);
  const blocks = splitZPLIntoBlocks(zplContent);
  const labelCount = computeLabelCount(blocks, format);
  return { blocks, labelCount };
};
