import { useCallback } from 'react';

const UPSCALE_ENDPOINT = 'https://ekoakbihwprthzjyztwq.supabase.co/functions/v1/upscale-image';

export const useServerUpscaler = () => {
  const blobToBase64 = useCallback(async (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }, []);

  const base64ToBlob = useCallback((base64: string, mimeType: string = 'image/png'): Blob => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return new Blob([bytes], { type: mimeType });
  }, []);

  const upscaleSingleImage = useCallback(async (
    imageBlob: Blob,
    scale: number = 2
  ): Promise<Blob> => {
    const base64 = await blobToBase64(imageBlob);
    
    const response = await fetch(UPSCALE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, scale })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }
    
    const data = await response.json();
    return base64ToBlob(data.upscaledImage, 'image/png');
  }, [blobToBase64, base64ToBlob]);

  const upscaleImages = useCallback(async (
    images: Blob[],
    scale: number = 2,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob[]> => {
    console.log(`🔄 Starting server-side upscaling: ${images.length} images at ${scale}x`);
    const startTime = Date.now();
    const results: Blob[] = [];
    
    // Atomic counter for accurate progress tracking across parallel operations
    let completedCount = 0;
    
    // Process in batches of 6 for optimized parallel processing
    const BATCH_SIZE = 6;
    
    for (let i = 0; i < images.length; i += BATCH_SIZE) {
      const batch = images.slice(i, Math.min(i + BATCH_SIZE, images.length));
      
      const batchResults = await Promise.all(
        batch.map(async (image, batchIndex) => {
          const globalIndex = i + batchIndex;
          try {
            const upscaled = await upscaleSingleImage(image, scale);
            console.log(`✅ [${globalIndex + 1}/${images.length}] Upscaled successfully`);
            // Increment atomic counter and report progress
            completedCount++;
            onProgress?.(completedCount, images.length);
            return upscaled;
          } catch (error) {
            console.warn(`⚠️ [${globalIndex + 1}/${images.length}] Upscale failed, using original:`, error);
            // Increment counter even on fallback
            completedCount++;
            onProgress?.(completedCount, images.length);
            return image;
          }
        })
      );
      
      results.push(...batchResults);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Server upscaling complete: ${results.length} images in ${elapsed}s`);
    
    return results;
  }, [upscaleSingleImage]);

  return {
    upscaleImages,
    upscaleSingleImage
  };
};
