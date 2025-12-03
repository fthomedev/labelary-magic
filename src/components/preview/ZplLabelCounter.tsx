
import React from 'react';

export function countLabels(zplContent: string): number {
  // Count complete labels by splitting on ^XZ and checking for ^XA
  const labels = zplContent.split('^XZ').filter(label => label.trim().includes('^XA'));
  return labels.length;
}
