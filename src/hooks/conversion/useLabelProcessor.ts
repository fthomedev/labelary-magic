
import { uploadPngToStorage } from '@/utils/pngStorage';
import { useZplValidator } from './useZplValidator';
import { createProcessingLog, ProcessingLogEntry } from '@/utils/processingLogger';

interface ProcessingResult {
  labelNumber: number;
  success: boolean;
  error?: string;
  pngUrl?: string;
  size?: number;
  validationWarnings?: string[];
  skipped?: boolean;
}

export const useLabelProcessor = () => {
  const { validateZplLabel } = useZplValidator();

  const processLabelToPng = async (
    labelContent: string, 
    labelNumber: number
  ): Promise<ProcessingResult> => {
    const startTime = Date.now();
    console.log(`🖼️ Processing label ${labelNumber}...`);
    console.log(`📝 ZPL Content (${labelContent.length} chars):`, labelContent.substring(0, 200) + '...');
    
    // Validate ZPL before processing
    const validation = validateZplLabel(labelContent);
    
    if (!validation.isValid) {
      const processingTime = Date.now() - startTime;
      const errorMsg = `Validation failed: ${validation.errors.join(', ')}`;
      
      console.error(`❌ Label ${labelNumber} failed validation:`, validation.errors);
      
      // Log failed validation
      await createProcessingLog({
        label_number: labelNumber,
        zpl_content: labelContent,
        status: 'failed',
        error_message: errorMsg,
        validation_warnings: validation.warnings,
        processing_time_ms: processingTime
      });
      
      return {
        labelNumber,
        success: false,
        error: errorMsg,
        validationWarnings: validation.warnings,
        skipped: true
      };
    }
    
    // Check for very short content that might cause issues
    const contentMatch = labelContent.match(/\^XA(.*?)\^XZ/s);
    if (contentMatch && contentMatch[1].trim().length < 5) {
      const processingTime = Date.now() - startTime;
      const errorMsg = 'ZPL content too short - likely empty label';
      
      console.warn(`⚠️ Label ${labelNumber} has very short content, skipping`);
      
      await createProcessingLog({
        label_number: labelNumber,
        zpl_content: labelContent,
        status: 'skipped',
        error_message: errorMsg,
        validation_warnings: validation.warnings,
        processing_time_ms: processingTime
      });
      
      return {
        labelNumber,
        success: false,
        error: errorMsg,
        validationWarnings: validation.warnings,
        skipped: true
      };
    }
    
    try {
      console.log(`🌐 Sending label ${labelNumber} to Labelary API...`);
      
      const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
        method: 'POST',
        headers: {
          'Accept': 'image/png',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: labelContent,
      });

      const processingTime = Date.now() - startTime;
      
      console.log(`📡 API Response for label ${labelNumber}: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        const errorText = await response.text();
        const errorMsg = `HTTP ${response.status}: ${errorText}`;
        
        console.error(`❌ Label ${labelNumber} failed with HTTP ${response.status}:`, errorText);
        
        // Log API failure
        await createProcessingLog({
          label_number: labelNumber,
          zpl_content: labelContent,
          status: 'failed',
          error_message: errorMsg,
          validation_warnings: validation.warnings,
          api_response_status: response.status,
          api_response_body: errorText.substring(0, 500),
          processing_time_ms: processingTime
        });
        
        return {
          labelNumber,
          success: false,
          error: errorMsg,
          validationWarnings: validation.warnings
        };
      }

      const pngBlob = await response.blob();
      
      if (pngBlob.size === 0) {
        const errorMsg = 'Empty PNG received from API';
        console.error(`❌ Label ${labelNumber} returned empty PNG`);
        
        await createProcessingLog({
          label_number: labelNumber,
          zpl_content: labelContent,
          status: 'failed',
          error_message: errorMsg,
          validation_warnings: validation.warnings,
          api_response_status: response.status,
          processing_time_ms: processingTime
        });
        
        return {
          labelNumber,
          success: false,
          error: errorMsg,
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
      
      // Log successful processing
      await createProcessingLog({
        label_number: labelNumber,
        zpl_content: labelContent,
        status: 'success',
        validation_warnings: validation.warnings,
        api_response_status: response.status,
        processing_time_ms: processingTime
      });
      
      return {
        labelNumber,
        success: true,
        pngUrl,
        size: pngBlob.size,
        validationWarnings: validation.warnings
      };
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`💥 Label ${labelNumber} processing error:`, error);
      
      // Log processing error
      await createProcessingLog({
        label_number: labelNumber,
        zpl_content: labelContent,
        status: 'failed',
        error_message: errorMsg,
        validation_warnings: validation.warnings,
        processing_time_ms: processingTime
      });
      
      return {
        labelNumber,
        success: false,
        error: errorMsg,
        validationWarnings: validation.warnings
      };
    }
  };

  return {
    processLabelToPng
  };
};
