/**
 * Centralized ZPL utility functions for label counting and parsing.
 * This is the SINGLE SOURCE OF TRUTH for ZPL label counting logic.
 * 
 * IMPORTANT: Each ZPL label has 2 ^XA markers, so we divide by 2 to get the correct count.
 * This applies to all conversion modes (Standard, A4, HD).
 */

import { splitZPLIntoBlocks } from './pdfUtils';

/**
 * Count the number of labels in ZPL content.
 * Uses the standard logic: count ^XA markers and divide by 2.
 * 
 * @param zplContent - The ZPL content string
 * @returns The number of labels
 */
export const countZplLabels = (zplContent: string): number => {
  const blocks = splitZPLIntoBlocks(zplContent);
  // Divide by 2 to get the correct count - each label has 2 ^XA markers
  const labelCount = Math.ceil(blocks.length / 2);
  return labelCount;
};

/**
 * Count labels with logging for debugging purposes.
 * 
 * @param zplContent - The ZPL content string
 * @param context - Optional context string for logging
 * @returns The number of labels
 */
export const countZplLabelsWithLog = (zplContent: string, context?: string): number => {
  const blocks = splitZPLIntoBlocks(zplContent);
  const labelCount = Math.ceil(blocks.length / 2);
  const prefix = context ? `[${context}] ` : '';
  console.log(`🔢 ${prefix}Counted ${labelCount} labels (${blocks.length} blocks / 2)`);
  return labelCount;
};

/**
 * Parse ZPL content into individual label blocks.
 * Returns the raw blocks (not divided by 2).
 * 
 * @param zplContent - The ZPL content string
 * @returns Array of individual ZPL label blocks
 */
export const parseZplBlocks = (zplContent: string): string[] => {
  return splitZPLIntoBlocks(zplContent);
};

/**
 * Parse ZPL content and return both blocks and the corrected label count.
 * 
 * @param zplContent - The ZPL content string
 * @returns Object with blocks array and corrected labelCount
 */
export const parseZplWithCount = (zplContent: string): { blocks: string[]; labelCount: number } => {
  const blocks = splitZPLIntoBlocks(zplContent);
  const labelCount = Math.ceil(blocks.length / 2);
  return { blocks, labelCount };
};
