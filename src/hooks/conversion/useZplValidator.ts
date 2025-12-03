
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

    // Only filter truly empty labels (just markers with no content)
    const contentBetweenMarkers = trimmed
      .replace(/\^XA/g, '')
      .replace(/\^XZ/g, '')
      .replace(/\^FS/g, '')
      .trim();
    
    if (contentBetweenMarkers.length === 0) {
      console.log(`🚫 Empty ZPL label detected (no content between markers)`);
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
        console.log(`🚫 Filtered out label ${index + 1}: "${label.substring(0, 80)}..."`);
      }
    });

    if (invalidCount > 0) {
      console.warn(`⚠️ VALIDATION: ${invalidCount} labels filtered out of ${labels.length} total`);
    }
    console.log(`✅ ZPL validation: ${validLabels.length}/${labels.length} labels valid`);
    return validLabels;
  };

  return {
    validateZplLabel,
    filterValidLabels
  };
};
