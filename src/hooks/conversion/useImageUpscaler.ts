import { useRef, useCallback } from 'react';

let Upscaler: any = null;

export const useImageUpscaler = () => {
  const upscalerRef = useRef<any>(null);
  const initializingRef = useRef<boolean>(false);

  const initUpscaler = useCallback(async () => {
    if (upscalerRef.current) return upscalerRef.current;
    if (initializingRef.current) {
      // Wait for initialization to complete
      while (initializingRef.current) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return upscalerRef.current;
    }

    initializingRef.current = true;
    
    try {
      console.log('🔧 Initializing UpscalerJS...');
      
      // Dynamic import to avoid loading TensorFlow on page load
      if (!Upscaler) {
        const module = await import('upscaler');
        Upscaler = module.default;
      }
      
      upscalerRef.current = new Upscaler({
        model: 'default', // Uses default lightweight model
      });
      
      console.log('✅ UpscalerJS initialized successfully');
      return upscalerRef.current;
    } catch (error) {
      console.error('❌ Failed to initialize UpscalerJS:', error);
      throw error;
    } finally {
      initializingRef.current = false;
    }
  }, []);

  const upscaleImage = useCallback(async (imageBlob: Blob): Promise<Blob> => {
    try {
      const upscaler = await initUpscaler();
      
      // Convert blob to image element
      const imageUrl = URL.createObjectURL(imageBlob);
      const img = new Image();
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageUrl;
      });

      // Upscale the image
      const upscaledImage = await upscaler.upscale(img);
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      // Convert result to blob
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) throw new Error('Could not get canvas context');
      
      canvas.width = upscaledImage.width;
      canvas.height = upscaledImage.height;
      ctx.drawImage(upscaledImage, 0, 0);
      
      return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) resolve(blob);
            else reject(new Error('Failed to create blob'));
          },
          'image/png',
          1.0
        );
      });
    } catch (error) {
      console.error('❌ Failed to upscale image:', error);
      // Return original image on failure
      return imageBlob;
    }
  }, [initUpscaler]);

  const upscaleImages = useCallback(async (
    imageBlobs: Blob[],
    onProgress?: (progress: number) => void
  ): Promise<Blob[]> => {
    console.log(`🖼️ Starting upscaling of ${imageBlobs.length} images...`);
    const startTime = Date.now();
    
    // Initialize upscaler first
    await initUpscaler();
    
    const results: Blob[] = [];
    
    for (let i = 0; i < imageBlobs.length; i++) {
      const upscaled = await upscaleImage(imageBlobs[i]);
      results.push(upscaled);
      
      if (onProgress) {
        onProgress((i + 1) / imageBlobs.length * 100);
      }
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Upscaling complete: ${results.length} images in ${elapsed}s`);
    
    return results;
  }, [initUpscaler, upscaleImage]);

  return {
    upscaleImage,
    upscaleImages,
    initUpscaler
  };
};
