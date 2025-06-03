
import React from 'react';

export function countLabels(zplContent: string): number {
  // Count by looking only for "^XA" markers in the ZPL content
  const regex = /\^XA/g;
  const matches = zplContent.match(regex);
  const xaCount = matches ? matches.length : 0;
  // Divide by 2 and round up, then divide by 2 again to get the correct count
  return Math.ceil(xaCount / 4);
}
