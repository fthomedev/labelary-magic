
import { delay } from './pdfUtils';

/**
 * Fetches a ZPL label from the Labelary API with retry logic
 */
export const fetchZPLWithRetry = async (
  zplContent: string, 
  retryCount = 0, 
  maxRetries = 3
): Promise<Blob> => {
  try {
    console.log(`Attempting ZPL conversion, attempt ${retryCount + 1}/${maxRetries + 1}`);
    
    const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/', {
      method: 'POST',
      headers: {
        'Accept': 'application/pdf',
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: zplContent,
    });

    if (response.status === 429) {
      // Rate limit hit, wait longer and retry
      console.log('Rate limit hit, waiting before retry...');
      if (retryCount < maxRetries) {
        const waitTime = Math.pow(2, retryCount) * 1500; // Exponential backoff
        await delay(waitTime);
        return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
      } else {
        throw new Error('rateLimitExceeded');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} ${response.statusText}, ${errorText}`);
      throw new Error(`apiError: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    // Validate blob size to ensure it's not an empty or invalid PDF
    if (blob.size < 500) { // Minimum size check
      console.warn(`Suspiciously small PDF received (${blob.size} bytes), may be invalid`);
      if (retryCount < maxRetries) {
        await delay(2000);
        return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
      } else {
        throw new Error('invalidPdfResponse');
      }
    }
    
    return blob;
  } catch (error) {
    if (retryCount < maxRetries) {
      const waitTime = Math.pow(2, retryCount) * 1500;
      console.log(`Error in fetch, retrying in ${waitTime}ms...`, error);
      await delay(waitTime);
      return fetchZPLWithRetry(zplContent, retryCount + 1, maxRetries);
    }
    throw error;
  }
};
