
export const splitZplIntoLabels = (zplContent: string): string[] => {
  console.log('🔍 Starting ZPL label splitting...');
  
  // Remove extra whitespace and normalize line endings
  const normalizedContent = zplContent.trim().replace(/\r\n/g, '\n');
  
  // Split by ^XZ and filter for blocks that contain ^XA
  const rawBlocks = normalizedContent.split('^XZ');
  const labels: string[] = [];
  
  rawBlocks.forEach((block, index) => {
    const trimmedBlock = block.trim();
    if (trimmedBlock.includes('^XA')) {
      // Add back the ^XZ marker
      const completeLabel = `${trimmedBlock}^XZ`;
      labels.push(completeLabel);
      console.log(`📋 Label ${index + 1} extracted: ${completeLabel.length} characters`);
    }
  });
  
  console.log(`✅ Found ${labels.length} valid ZPL labels`);
  return labels;
};
