
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
    
    // Check for problematic patterns that cause 404 errors
    const problematicPatterns = [
      {
        pattern: /\^ID[A-Z]:.*\.GRF/gi,
        message: 'References external graphic files that may not exist'
      },
      {
        pattern: /\^XG[A-Z]:.*\.GRF/gi,
        message: 'References recall graphic that may not exist'
      },
      {
        pattern: /\^DF[A-Z]:/gi,
        message: 'Download format command - may reference missing resources'
      },
      {
        pattern: /\^IL[A-Z]:/gi,
        message: 'Image Load command - may reference missing images'
      }
    ];
    
    problematicPatterns.forEach(({ pattern, message }) => {
      const matches = zplContent.match(pattern);
      if (matches) {
        // These patterns often cause 404 errors, so mark as invalid
        errors.push(`${message} (found: ${matches.join(', ')})`);
        console.log(`❌ Found problematic pattern in ZPL: ${matches.join(', ')}`);
      }
    });
    
    // Check for empty content between ^XA and ^XZ
    const contentMatch = zplContent.match(/\^XA(.*?)\^XZ/s);
    if (contentMatch) {
      const innerContent = contentMatch[1].trim();
      if (innerContent.length < 5) {
        errors.push('Very short or empty content between ^XA and ^XZ');
      } else if (innerContent.length < 15) {
        warnings.push('Very short content between ^XA and ^XZ - may be incomplete label');
      }
    }
    
    // Check for invalid characters or encoding issues
    if (/[^\x20-\x7E\r\n\t]/g.test(zplContent)) {
      warnings.push('Contains non-ASCII characters that may cause issues');
    }
    
    // Check for missing field commands but don't mark as invalid
    if (!zplContent.includes('^FO') && !zplContent.includes('^FT')) {
      warnings.push('No field origin (^FO) or field typeset (^FT) commands found');
    }
    
    // Check for common demo patterns that might not work
    if (zplContent.includes('DEMO.GRF') || zplContent.includes(':DEMO')) {
      errors.push('Contains demo graphic references that are not available');
    }
    
    // Check for incomplete ZPL commands
    const incompleteCommands = zplContent.match(/\^[A-Z]{1,2}$/gm);
    if (incompleteCommands) {
      warnings.push(`Possible incomplete commands: ${incompleteCommands.join(', ')}`);
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
