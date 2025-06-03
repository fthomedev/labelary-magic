
import { uploadPngToStorage } from '@/utils/pngStorage';
import { useZplValidator } from './useZplValidator';

interface ProcessingResult {
  labelNumber: number;
  success: boolean;
  error?: string;
  pngUrl?: string;
  size?: number;
  validationWarnings?: string[];
}

export const useLabelProcessor = () => {
  const { validateZplLabel } = useZplValidator();

  const processLabelToPng = async (
    labelContent: string, 
    labelNumber: number
  ): Promise<ProcessingResult> => {
    console.log(`🖼️ Processing label ${labelNumber}...`);
    
    // Validate ZPL before processing
    const validation = validateZplLabel(labelContent);
    
    if (!validation.isValid) {
      console.error(`❌ Label ${labelNumber} failed validation:`, validation.errors);
      return {
        labelNumber,
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        validationWarnings: validation.warnings
      };
    }
    
    try {
      const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
        method: 'POST',
        headers: {
          'Accept': 'image/png',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: labelContent,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Label ${labelNumber} failed with HTTP ${response.status}: ${errorText}`);
        
        return {
          labelNumber,
          success: false,
          error: `HTTP ${response.status}: ${errorText.substring(0, 100)}...`,
          validationWarnings: validation.warnings
        };
      }

      const pngBlob = await response.blob();
      
      if (pngBlob.size === 0) {
        console.error(`❌ Label ${labelNumber} returned empty PNG`);
        return {
          labelNumber,
          success: false,
          error: 'Empty PNG received from API',
          validationWarnings: validation.warnings
        };
      }

      // Generate timestamp-based filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `label-${timestamp}-${labelNumber.toString().padStart(3, '0')}.png`;
      
      // Upload to Supabase storage
      const pngUrl = await uploadPngToStorage(pngBlob, fileName);
      
      console.log(`✅ Label ${labelNumber} processed successfully: ${pngBlob.size} bytes -> ${pngUrl}`);
      
      if (validation.warnings.length > 0) {
        console.log(`⚠️ Label ${labelNumber} has warnings:`, validation.warnings);
      }
      
      return {
        labelNumber,
        success: true,
        pngUrl,
        size: pngBlob.size,
        validationWarnings: validation.warnings
      };
      
    } catch (error) {
      console.error(`💥 Label ${labelNumber} processing error:`, error);
      return {
        labelNumber,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        validationWarnings: validation.warnings
      };
    }
  };

  return {
    processLabelToPng
  };
};
