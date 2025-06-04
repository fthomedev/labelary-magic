
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
    
    // Trim whitespace and normalize
    const normalizedContent = zplContent.trim();
    
    // Basic structure validation
    if (!normalizedContent.includes('^XA')) {
      errors.push('Comando ^XA (Start Format) não encontrado');
    }
    
    if (!normalizedContent.includes('^XZ')) {
      errors.push('Comando ^XZ (End Format) não encontrado');
    }
    
    // Check for very short content - these are usually invalid
    if (normalizedContent.length < 30) {
      errors.push(`Conteúdo muito curto (${normalizedContent.length} chars) - provavelmente inválido`);
    }
    
    // Check for problematic patterns that cause API failures
    const problematicPatterns = [
      {
        pattern: /\^ID[A-Z]:.*\.GRF/gi,
        message: 'Referência a arquivo gráfico externo que pode não existir'
      },
      {
        pattern: /\^XG[A-Z]:.*\.GRF/gi,
        message: 'Comando de recall gráfico que pode não existir'
      },
      {
        pattern: /\^DF[A-Z]:/gi,
        message: 'Comando download format - pode referenciar recursos inexistentes'
      },
      {
        pattern: /\^IL[A-Z]:/gi,
        message: 'Comando image load - pode referenciar imagens inexistentes'
      },
      {
        pattern: /DEMO\.GRF/gi,
        message: 'Referência a arquivo demo que não está disponível'
      },
      {
        pattern: /~DG[A-Z]:DEMO/gi,
        message: 'Download gráfico demo que pode não funcionar'
      }
    ];
    
    problematicPatterns.forEach(({ pattern, message }) => {
      const matches = normalizedContent.match(pattern);
      if (matches) {
        errors.push(`${message} (encontrado: ${matches.join(', ')})`);
        console.log(`❌ Padrão problemático encontrado: ${matches.join(', ')}`);
      }
    });
    
    // Check for empty content between ^XA and ^XZ
    const contentMatch = normalizedContent.match(/\^XA(.*?)\^XZ/s);
    if (contentMatch) {
      const innerContent = contentMatch[1].trim();
      if (innerContent.length < 5) {
        errors.push('Conteúdo vazio ou muito curto entre ^XA e ^XZ');
      } else if (innerContent.length < 20) {
        warnings.push('Conteúdo muito curto entre ^XA e ^XZ - pode ser etiqueta incompleta');
      }
    }
    
    // Check for labels that are just graphic references without content
    const isOnlyGraphicReference = /^\^XA\s*\^ID[A-Z]:.*\.GRF\s*\^FS\s*\^XZ\s*$/i.test(normalizedContent);
    if (isOnlyGraphicReference) {
      errors.push('Etiqueta contém apenas referência gráfica sem conteúdo adicional');
    }
    
    // Check for invalid characters or encoding issues
    if (/[^\x20-\x7E\r\n\t]/g.test(normalizedContent)) {
      warnings.push('Contém caracteres não-ASCII que podem causar problemas');
    }
    
    // Check for missing field commands but don't mark as invalid
    if (!normalizedContent.includes('^FO') && !normalizedContent.includes('^FT') && !normalizedContent.includes('^ID')) {
      warnings.push('Nenhum comando de campo (^FO) ou typeset (^FT) encontrado');
    }
    
    // Check for incomplete ZPL commands
    const incompleteCommands = normalizedContent.match(/\^[A-Z]{1,2}$/gm);
    if (incompleteCommands) {
      warnings.push(`Possíveis comandos incompletos: ${incompleteCommands.join(', ')}`);
    }
    
    const isValid = errors.length === 0;
    
    console.log(`${isValid ? '✅' : '❌'} ZPL validation: ${isValid ? 'VÁLIDO' : 'INVÁLIDO'}`);
    if (errors.length > 0) {
      console.log(`❌ Erros (${errors.length}):`, errors);
    }
    if (warnings.length > 0) {
      console.log(`⚠️ Avisos (${warnings.length}):`, warnings);
    }
    
    return {
      isValid,
      errors,
      warnings
    };
  };

  const validateAllLabels = (labels: string[]) => {
    console.log(`🔍 Iniciando validação de ${labels.length} etiquetas ZPL...`);
    
    const results = labels.map((label, index) => {
      const result = validateZplLabel(label);
      return {
        labelNumber: index + 1,
        ...result
      };
    });
    
    const validLabels = results.filter(r => r.isValid).length;
    const invalidLabels = results.filter(r => !r.isValid).length;
    
    console.log(`📊 Resumo da validação: ${validLabels} válidas, ${invalidLabels} inválidas`);
    
    // Log details for invalid labels
    results.forEach(result => {
      if (!result.isValid) {
        console.log(`❌ Etiqueta ${result.labelNumber} inválida:`, result.errors);
      }
      if (result.warnings.length > 0) {
        console.log(`⚠️ Etiqueta ${result.labelNumber} avisos:`, result.warnings);
      }
    });
    
    return results;
  };

  return {
    validateZplLabel,
    validateAllLabels
  };
};
