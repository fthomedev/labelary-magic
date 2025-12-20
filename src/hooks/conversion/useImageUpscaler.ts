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
      const initStart = Date.now();
      upscalerInstance = new Upscaler({
        model: x2,
      });
      console.log(`✅ UpscalerJS initialized in ${Date.now() - initStart}ms`);
    }
    return upscalerInstance;
  };

  // Pre-warm the upscaler (call early to avoid delay during processing)
  const preloadUpscaler = async (): Promise<void> => {
    console.log('🔥 Pre-loading upscaler model...');
    const start = Date.now();
    await getUpscaler();
    console.log(`✅ Upscaler pre-loaded in ${Date.now() - start}ms`);
  };

  // WebGL texture size limit (most GPUs support 16384, use conservative 8192)
  const MAX_TEXTURE_SIZE = 8192;

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

  const resizeImageForWebGL = (img: HTMLImageElement): HTMLCanvasElement | HTMLImageElement => {
    const { width, height } = img;
    
    // Check if resize is needed
    if (width <= MAX_TEXTURE_SIZE && height <= MAX_TEXTURE_SIZE) {
      return img;
    }

    // Calculate new dimensions maintaining aspect ratio
    const scale = Math.min(MAX_TEXTURE_SIZE / width, MAX_TEXTURE_SIZE / height);
    const newWidth = Math.floor(width * scale);
    const newHeight = Math.floor(height * scale);

    console.log(`📐 Resizing image for WebGL: ${width}x${height} → ${newWidth}x${newHeight}`);

    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      console.warn('⚠️ Could not get canvas context, using original image');
      return img;
    }

    ctx.drawImage(img, 0, 0, newWidth, newHeight);
    return canvas;
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
    const UPSCALE_TIMEOUT_MS = 45_000;

    const abortController = new AbortController();
    const timeoutId = window.setTimeout(() => {
      abortController.abort();
    }, UPSCALE_TIMEOUT_MS);

    try {
      const upscaler = await getUpscaler();
      const img = await blobToImage(blob);

      // Resize image if it exceeds WebGL texture limits
      const resizedInput = resizeImageForWebGL(img);

      // IMPORTANT: Some GPUs/WebGL drivers can hang during upscale.
      // Use AbortController so a stuck upscale doesn't freeze the whole HD pipeline.
      const upscaledSrc = (await upscaler.upscale(resizedInput as any, {
        output: 'base64',
        signal: abortController.signal,
      } as const)) as unknown as string;

      // Convert data URL back to Blob
      const upscaledBlob = await dataUrlToBlob(upscaledSrc);

      return upscaledBlob;
    } catch (error) {
      if (abortController.signal.aborted) {
        console.warn('⏱️ Upscaling timed out/aborted, using original image');
      } else {
        console.error('⚠️ Upscaling failed, using original image:', error);
      }
      // Fallback to original image on any error
      return blob;
    } finally {
      clearTimeout(timeoutId);
    }
  };

  // Best-effort: yield the main thread so the browser can reclaim GPU/JS memory.
  // Avoid tf.disposeVariables() here because it can break the upscaler model for the next run.
  const cleanupTensorMemory = async (): Promise<void> => {
    try {
      console.log('🧹 Finalizing: yielding for memory cleanup...');
      await new Promise(resolve => setTimeout(resolve, 120));

      // If tf is present, log memory stats (no disposing)
      try {
        const tf = await import('@tensorflow/tfjs');
        console.log(`📊 TensorFlow tensors (info): ${tf.memory().numTensors}`);
      } catch {
        // ignore if tf can't be imported
      }

      console.log('✅ Finalizing step complete');
    } catch (error) {
      console.warn('⚠️ Finalizing warning:', error);
    }
  };

  const upscaleImages = async (
    blobs: Blob[],
    onProgress: (progress: number, currentImage?: number) => void
  ): Promise<Blob[]> => {
    if (blobs.length === 0) {
      console.log('🔍 Upscaling: No images to process');
      return [];
    }

    const MAX_CONCURRENT = 1;
    const semaphore = new UpscaleSemaphore(MAX_CONCURRENT);
    const results: (Blob | null)[] = new Array(blobs.length).fill(null);
    let completed = 0;
    let successCount = 0;
    let fallbackCount = 0;
    let errorCount = 0;

    console.log(`\n========== UPSCALING START ==========`);
    console.log(`📊 Input: ${blobs.length} images`);
    console.log(`⚙️ Concurrent limit: ${MAX_CONCURRENT}`);
    const startTime = Date.now();

    const processImage = async (blob: Blob, index: number): Promise<void> => {
      await semaphore.acquire();
      
      try {
        console.log(`🔄 [${index + 1}/${blobs.length}] Processing image (${(blob.size / 1024).toFixed(1)}KB)`);
        const upscaledBlob = await upscaleImage(blob);
        
        if (upscaledBlob !== blob) {
          successCount++;
          console.log(`✅ [${index + 1}] Upscaled: ${(blob.size / 1024).toFixed(1)}KB → ${(upscaledBlob.size / 1024).toFixed(1)}KB`);
        } else {
          fallbackCount++;
          console.log(`⚠️ [${index + 1}] Fallback to original (upscaling returned same blob)`);
        }
        
        results[index] = upscaledBlob;
      } catch (error) {
        errorCount++;
        console.error(`❌ [${index + 1}] Upscaling FAILED:`, error);
        // CRITICAL: Always preserve the original image on any error
        results[index] = blob;
        console.log(`🔄 [${index + 1}] Using original image as fallback`);
      } finally {
        completed++;
        const progressValue = (completed / blobs.length) * 100;
        onProgress(progressValue, completed);
        semaphore.release();
      }
    };

    // Process all images in parallel with semaphore control
    await Promise.all(blobs.map((blob, i) => processImage(blob, i)));

    // Detailed validation
    const nullIndices = results.map((img, i) => img === null ? i : -1).filter(i => i !== -1);
    const nonNullCount = results.filter(img => img !== null).length;
    
    console.log(`\n========== UPSCALING SUMMARY ==========`);
    console.log(`📊 Input images: ${blobs.length}`);
    console.log(`✅ Successfully upscaled: ${successCount}`);
    console.log(`⚠️ Fallback to original: ${fallbackCount}`);
    console.log(`❌ Errors (using original): ${errorCount}`);
    console.log(`📤 Output images: ${nonNullCount}`);
    
    if (nullIndices.length > 0) {
      console.error(`🚨 CRITICAL: ${nullIndices.length} NULL images at indices: [${nullIndices.join(', ')}]`);
      console.error(`🚨 This should NEVER happen - investigating...`);
    }
    
    if (nonNullCount !== blobs.length) {
      console.error(`🚨 LABEL LOSS DETECTED: ${blobs.length - nonNullCount} images missing!`);
    } else {
      console.log(`✅ All ${blobs.length} images preserved`);
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`⏱️ Total time: ${elapsed}s`);
    console.log(`========================================\n`);

    // Return all non-null images
    return results.filter((img): img is Blob => img !== null);
  };

  return {
    upscaleImage,
    upscaleImages,
    preloadUpscaler,
    cleanupTensorMemory,
  };
};
