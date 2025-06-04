
export const useZplValidator = () => {
  const validateZplLabel = (zplContent: string): boolean => {
    if (!zplContent || zplContent.trim().length === 0) {
      return false;
    }

    const trimmed = zplContent.trim();
    
    // Check for minimum ZPL structure
    if (!trimmed.includes('^XA') || !trimmed.includes('^XZ')) {
      return false;
    }

    // Check for invalid patterns that cause "no labels generated"
    const invalidPatterns = [
      /^\^XA\^IDR:/,  // Labels that only reference graphics without content
      /^\^XA\^FS\^XZ$/,  // Empty labels with only field separator
      /^\^XA\s*\^XZ$/,   // Labels with only start and end markers
    ];

    for (const pattern of invalidPatterns) {
      if (pattern.test(trimmed)) {
        console.log(`🚫 Invalid ZPL pattern detected: ${trimmed.substring(0, 50)}...`);
        return false;
      }
    }

    // Check for very short labels that are likely incomplete
    if (trimmed.length < 15) {
      console.log(`🚫 ZPL too short: ${trimmed}`);
      return false;
    }

    return true;
  };

  const filterValidLabels = (labels: string[]): string[] => {
    const validLabels: string[] = [];
    let invalidCount = 0;

    labels.forEach((label, index) => {
      if (validateZplLabel(label)) {
        validLabels.push(label);
      } else {
        invalidCount++;
        console.log(`🚫 Skipping invalid label ${index + 1}: ${label.substring(0, 50)}...`);
      }
    });

    console.log(`✅ ZPL validation complete: ${validLabels.length} valid, ${invalidCount} invalid labels`);
    return validLabels;
  };

  return {
    validateZplLabel,
    filterValidLabels
  };
};
