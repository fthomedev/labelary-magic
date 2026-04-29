import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const UPSCALE_ENDPOINT = 'https://ekoakbihwprthzjyztwq.supabase.co/functions/v1/upscale-image';

// In-memory LRU cache for upscaled blobs (keyed by SHA-1 of input + scale).
// Survives across calls within the same session/tab; bounded to avoid memory blow-up.
const MAX_CACHE_ENTRIES = 200;
const upscaleCache = new Map<string, Blob>();

const cacheGet = (key: string): Blob | undefined => {
  const v = upscaleCache.get(key);
  if (v) {
    // Refresh recency
    upscaleCache.delete(key);
    upscaleCache.set(key, v);
  }
  return v;
};

const cacheSet = (key: string, blob: Blob) => {
  if (upscaleCache.has(key)) upscaleCache.delete(key);
  upscaleCache.set(key, blob);
  while (upscaleCache.size > MAX_CACHE_ENTRIES) {
    const firstKey = upscaleCache.keys().next().value;
    if (firstKey === undefined) break;
    upscaleCache.delete(firstKey);
  }
};

const sha1Hex = async (buf: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-1', buf);
  const bytes = new Uint8Array(digest);
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
};

export const useServerUpscaler = () => {
  const upscaleSingleImage = useCallback(async (
    imageBlob: Blob,
    scale: number = 2
  ): Promise<Blob> => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('Authentication required for image upscaling');
    }

    const inputBuffer = await imageBlob.arrayBuffer();
    const hash = await sha1Hex(inputBuffer);
    const cacheKey = `${hash}@${scale}`;

    const cached = cacheGet(cacheKey);
    if (cached) {
      return cached;
    }

    // Binary transport: send raw PNG bytes, request raw PNG response.
    // ~30-40% less network overhead vs base64/JSON.
    const response = await fetch(`${UPSCALE_ENDPOINT}?scale=${scale}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
        'Accept': 'image/png',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: inputBuffer,
    });

    if (!response.ok) {
      let message = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData?.error) message = errorData.error;
      } catch {
        // Non-JSON error body, keep generic message
      }
      throw new Error(message);
    }

    const upscaledBlob = await response.blob();
    const finalBlob = upscaledBlob.type === 'image/png'
      ? upscaledBlob
      : new Blob([upscaledBlob], { type: 'image/png' });

    cacheSet(cacheKey, finalBlob);
    return finalBlob;
  }, []);

  const upscaleImages = useCallback(async (
    images: Blob[],
    scale: number = 2,
    onProgress?: (current: number, total: number) => void
  ): Promise<Blob[]> => {
    console.log(`🔄 Starting server-side upscaling: ${images.length} images at ${scale}x (binary + LRU cache)`);
    const startTime = Date.now();
    const results: Blob[] = new Array(images.length);

    const MAX_CONCURRENT = 6;
    let nextIndex = 0;
    let completedCount = 0;
    let cacheHits = 0;

    let pendingFrame = false;
    const reportProgress = () => {
      if (!onProgress) return;
      if (pendingFrame) return;
      pendingFrame = true;
      const flush = () => {
        pendingFrame = false;
        onProgress(completedCount, images.length);
      };
      if (typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(flush);
      } else {
        setTimeout(flush, 16);
      }
    };

    const worker = async () => {
      while (true) {
        const i = nextIndex++;
        if (i >= images.length) return;
        try {
          const before = upscaleCache.size;
          results[i] = await upscaleSingleImage(images[i], scale);
          if (upscaleCache.size === before) {
            // Hit (size didn't grow because key already present)
            cacheHits++;
          }
        } catch (error) {
          console.warn(`⚠️ [${i + 1}/${images.length}] Upscale failed, using original:`, error);
          results[i] = images[i];
        }
        completedCount++;
        reportProgress();
      }
    };

    const workers = Array.from(
      { length: Math.min(MAX_CONCURRENT, images.length) },
      () => worker()
    );
    await Promise.all(workers);

    onProgress?.(completedCount, images.length);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`✅ Server upscaling complete: ${results.length} images in ${elapsed}s (cache hits: ${cacheHits})`);

    return results;
  }, [upscaleSingleImage]);

  return {
    upscaleImages,
    upscaleSingleImage,
  };
};
