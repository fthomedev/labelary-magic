
import { useTranslation } from 'react-i18next';

interface ZplValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const useZplValidator = () => {
  const { t } = useTranslation();

  const validateZplLabel = (zplContent: string): ZplValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    console.log(`🔍 Validating ZPL label (${zplContent.length} chars)...`);
    
    // Basic structure validation
    if (!zplContent.includes('^XA')) {
      errors.push('Missing ^XA (Start Format) command');
    }
    
    if (!zplContent.includes('^XZ')) {
      errors.push('Missing ^XZ (End Format) command');
    }
    
    // Check for common problematic patterns
    const problematicPatterns = [
      {
        pattern: /\^ID[A-Z]:.*\.GRF/g,
        message: 'References external graphic files that may not exist'
      },
      {
        pattern: /\^XG[A-Z]:.*\.GRF/g,
        message: 'References recall graphic that may not exist'
      },
      {
        pattern: /\^DF[A-Z]:/g,
        message: 'Download format command - may reference missing resources'
      }
    ];
    
    problematicPatterns.forEach(({ pattern, message }) => {
      const matches = zplContent.match(pattern);
      if (matches) {
        warnings.push(`${message} (found: ${matches.join(', ')})`);
      }
    });
    
    // Check for empty content between ^XA and ^XZ
    const contentMatch = zplContent.match(/\^XA(.*?)\^XZ/s);
    if (contentMatch && contentMatch[1].trim().length < 10) {
      warnings.push('Very short content between ^XA and ^XZ - may be empty label');
    }
    
    // Check for invalid characters or encoding issues
    if (/[^\x20-\x7E\r\n\t]/g.test(zplContent)) {
      warnings.push('Contains non-ASCII characters that may cause issues');
    }
    
    // Check for missing field commands
    if (!zplContent.includes('^FO') && !zplContent.includes('^FT')) {
      warnings.push('No field origin (^FO) or field typeset (^FT) commands found');
    }
    
    const isValid = errors.length === 0;
    
    console.log(`✅ ZPL validation complete: ${isValid ? 'VALID' : 'INVALID'}`);
    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`, errors);
    }
    if (warnings.length > 0) {
      console.log(`⚠️ Warnings (${warnings.length}):`, warnings);
    }
    
    return {
      isValid,
      errors,
      warnings
    };
  };

  const validateAllLabels = (labels: string[]) => {
    console.log(`🔍 Starting validation of ${labels.length} ZPL labels...`);
    
    const results = labels.map((label, index) => {
      const result = validateZplLabel(label);
      return {
        labelNumber: index + 1,
        ...result
      };
    });
    
    const validLabels = results.filter(r => r.isValid).length;
    const invalidLabels = results.filter(r => !r.isValid).length;
    
    console.log(`📊 Validation summary: ${validLabels} valid, ${invalidLabels} invalid labels`);
    
    // Log details for invalid labels
    results.forEach(result => {
      if (!result.isValid) {
        console.log(`❌ Label ${result.labelNumber} validation failed:`, result.errors);
      }
      if (result.warnings.length > 0) {
        console.log(`⚠️ Label ${result.labelNumber} warnings:`, result.warnings);
      }
    });
    
    return results;
  };

  return {
    validateZplLabel,
    validateAllLabels
  };
};
