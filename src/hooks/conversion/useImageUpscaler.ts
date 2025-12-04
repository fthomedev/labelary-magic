import Upscaler from 'upscaler';
import x2 from '@upscalerjs/default-model';

// Singleton upscaler instance for model caching
let upscalerInstance: InstanceType<typeof Upscaler> | null = null;

// Semaphore for controlling concurrent upscaling
class UpscaleSemaphore {
  private permits: number;
  private queue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }
    return new Promise<void>(resolve => this.queue.push(resolve));
  }

  release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) next();
    } else {
      this.permits++;
    }
  }
}

export const useImageUpscaler = () => {
  const getUpscaler = async (): Promise<InstanceType<typeof Upscaler>> => {
    if (!upscalerInstance) {
      console.log('🔧 Initializing UpscalerJS with default model (2x)...');
      upscalerInstance = new Upscaler({
        model: x2,
      });
    }
    return upscalerInstance;
  };

  const blobToImage = (blob: Blob): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(img.src);
        resolve(img);
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(blob);
    });
  };

  const dataUrlToBlob = (dataUrl: string): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        const arr = dataUrl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        resolve(new Blob([u8arr], { type: mime }));
      } catch (error) {
        reject(error);
      }
    });
  };

  const upscaleImage = async (blob: Blob): Promise<Blob> => {
    try {
      const upscaler = await getUpscaler();
      const img = await blobToImage(blob);
      
      // Upscale the image (returns base64 data URL by default)
      const upscaledSrc = await upscaler.upscale(img);
      
      // Convert data URL back to Blob
      const upscaledBlob = await dataUrlToBlob(upscaledSrc);
      
      return upscaledBlob;
    } catch (error) {
      console.error('⚠️ Upscaling failed, using original image:', error);
      // Fallback to original image on error
      return blob;
    }
  };

  const upscaleImages = async (
    blobs: Blob[],
    onProgress: (progress: number) => void
  ): Promise<Blob[]> => {
    if (blobs.length === 0) return [];

    const MAX_CONCURRENT = 3; // Limit concurrent upscaling to avoid memory issues
    const semaphore = new UpscaleSemaphore(MAX_CONCURRENT);
    const results: (Blob | null)[] = new Array(blobs.length).fill(null);
    let completed = 0;

    console.log(`🔍 Starting AI upscaling of ${blobs.length} images (${MAX_CONCURRENT} concurrent)`);
    const startTime = Date.now();

    const processImage = async (blob: Blob, index: number): Promise<void> => {
      await semaphore.acquire();
      
      try {
        const upscaledBlob = await upscaleImage(blob);
        results[index] = upscaledBlob;
      } catch (error) {
        // CRITICAL: Always preserve the original image on any error
        console.error(`⚠️ Upscaling failed for image ${index + 1}, using original:`, error);
        results[index] = blob;
      } finally {
        completed++;
        const progressValue = (completed / blobs.length) * 100;
        onProgress(progressValue);
        
        if (completed % 10 === 0 || completed === blobs.length) {
          console.log(`🔍 Processed ${completed}/${blobs.length} images`);
        }
        semaphore.release();
      }
    };

    // Process all images in parallel with semaphore control
    await Promise.all(blobs.map((blob, i) => processImage(blob, i)));

    // CRITICAL: All results should be set (original or upscaled) - no filtering needed
    // But validate just in case
    const nullCount = results.filter(img => img === null).length;
    if (nullCount > 0) {
      console.error(`🚨 CRITICAL: ${nullCount} images are null after upscaling - this should not happen!`);
    }
    
    // Return all non-null images (should be all of them)
    const finalImages = results.filter((img): img is Blob => img !== null);
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    console.log(`✨ AI upscaling complete: ${finalImages.length}/${blobs.length} in ${elapsed}s`);

    return finalImages;
  };

  return {
    upscaleImage,
    upscaleImages,
  };
};
