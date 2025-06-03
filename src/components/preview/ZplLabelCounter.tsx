
import React from 'react';
import { splitZPLIntoBlocks } from '@/utils/pdfUtils';

export function countLabels(zplContent: string): number {
  // Use the same logic as the conversion system to ensure consistency
  const labels = splitZPLIntoBlocks(zplContent);
  console.log(`🏷️ ZplLabelCounter: Counted ${labels.length} labels (using splitZPLIntoBlocks)`);
  return labels.length;
}
