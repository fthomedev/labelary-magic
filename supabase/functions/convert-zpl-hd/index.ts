import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";
import pako from "https://esm.sh/pako@2.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Configuration - optimized for Labelary rate limits
const MAX_LABELS_PER_REQUEST = 20;
const LABELARY_CONCURRENT = 2; // Reduced from 4 to avoid 429s
const UPSCALE_FACTOR = 2;
const MAX_RETRIES = 4;
const RETRY_DELAYS = [2000, 4000, 8000, 16000]; // More conservative backoff

// Semaphore for controlling concurrent requests
class Semaphore {
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

// Nearest Neighbor upscaling - perfect for barcodes
function upscaleNearestNeighbor(
  inputData: Uint8ClampedArray,
  inputWidth: number,
  inputHeight: number,
  scale: number
): { data: Uint8ClampedArray; width: number; height: number } {
  const outputWidth = Math.floor(inputWidth * scale);
  const outputHeight = Math.floor(inputHeight * scale);
  const outputData = new Uint8ClampedArray(outputWidth * outputHeight * 4);

  for (let y = 0; y < outputHeight; y++) {
    for (let x = 0; x < outputWidth; x++) {
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      
      const srcIndex = (srcY * inputWidth + srcX) * 4;
      const dstIndex = (y * outputWidth + x) * 4;
      
      outputData[dstIndex] = inputData[srcIndex];
      outputData[dstIndex + 1] = inputData[srcIndex + 1];
      outputData[dstIndex + 2] = inputData[srcIndex + 2];
      outputData[dstIndex + 3] = inputData[srcIndex + 3];
    }
  }

  return { data: outputData, width: outputWidth, height: outputHeight };
}

// CRC32 for PNG
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c;
  }
  return table;
})();

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc = crcTable[(crc ^ data[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// PNG encoder with proper zlib compression using pako
function encodePNG(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = new Uint8Array(25);
  const ihdrData = new DataView(ihdr.buffer);
  ihdrData.setUint32(0, 13);
  ihdr[4] = 73; ihdr[5] = 72; ihdr[6] = 68; ihdr[7] = 82;
  ihdrData.setUint32(8, width);
  ihdrData.setUint32(12, height);
  ihdr[16] = 8; ihdr[17] = 6; ihdr[18] = 0; ihdr[19] = 0; ihdr[20] = 0;
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdrData.setUint32(21, ihdrCrc);
  
  // Prepare raw image data with filter bytes
  const rawData = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = data[srcIdx];
      rawData[dstIdx + 1] = data[srcIdx + 1];
      rawData[dstIdx + 2] = data[srcIdx + 2];
      rawData[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  
  // Compress with pako (zlib format)
  const compressed = pako.deflate(rawData, { level: 6 });
  
  // IDAT chunk
  const idat = new Uint8Array(12 + compressed.length);
  const idatData = new DataView(idat.buffer);
  idatData.setUint32(0, compressed.length);
  idat[4] = 73; idat[5] = 68; idat[6] = 65; idat[7] = 84;
  idat.set(compressed, 8);
  const idatCrc = crc32(idat.slice(4, 8 + compressed.length));
  idatData.setUint32(8 + compressed.length, idatCrc);
  
  // IEND chunk
  const iend = new Uint8Array(12);
  const iendData = new DataView(iend.buffer);
  iendData.setUint32(0, 0);
  iend[4] = 73; iend[5] = 69; iend[6] = 78; iend[7] = 68;
  const iendCrc = crc32(iend.slice(4, 8));
  iendData.setUint32(8, iendCrc);
  
  // Combine all chunks
  const png = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  png.set(signature, offset); offset += signature.length;
  png.set(ihdr, offset); offset += ihdr.length;
  png.set(idat, offset); offset += idat.length;
  png.set(iend, offset);
  
  return png;
}

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

// PNG decoder using pako for decompression
function decodePNG(pngData: Uint8Array): { data: Uint8ClampedArray; width: number; height: number } {
  // Verify PNG signature
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (pngData[i] !== signature[i]) {
      throw new Error('Invalid PNG signature');
    }
  }

  let width = 0, height = 0, bitDepth = 0, colorType = 0;
  const compressedData: Uint8Array[] = [];
  let pos = 8;

  while (pos < pngData.length) {
    const length = (pngData[pos] << 24) | (pngData[pos + 1] << 16) | (pngData[pos + 2] << 8) | pngData[pos + 3];
    const type = String.fromCharCode(pngData[pos + 4], pngData[pos + 5], pngData[pos + 6], pngData[pos + 7]);
    
    if (type === 'IHDR') {
      width = (pngData[pos + 8] << 24) | (pngData[pos + 9] << 16) | (pngData[pos + 10] << 8) | pngData[pos + 11];
      height = (pngData[pos + 12] << 24) | (pngData[pos + 13] << 16) | (pngData[pos + 14] << 8) | pngData[pos + 15];
      bitDepth = pngData[pos + 16];
      colorType = pngData[pos + 17];
    } else if (type === 'IDAT') {
      compressedData.push(pngData.slice(pos + 8, pos + 8 + length));
    } else if (type === 'IEND') {
      break;
    }
    
    pos += 12 + length;
  }

  // Combine all IDAT chunks
  const totalCompressed = compressedData.reduce((sum, chunk) => sum + chunk.length, 0);
  const allCompressed = new Uint8Array(totalCompressed);
  let offset = 0;
  for (const chunk of compressedData) {
    allCompressed.set(chunk, offset);
    offset += chunk.length;
  }

  // Decompress using pako
  const decompressed = pako.inflate(allCompressed);

  // Calculate bytes per pixel
  let bytesPerPixel = 1;
  if (colorType === 2) bytesPerPixel = 3; // RGB
  else if (colorType === 4) bytesPerPixel = 2; // Grayscale + Alpha
  else if (colorType === 6) bytesPerPixel = 4; // RGBA

  const rowBytes = width * bytesPerPixel + 1; // +1 for filter byte
  const imageData = new Uint8ClampedArray(width * height * 4);

  // Decode with filter reconstruction
  let prevRow = new Uint8Array(width * bytesPerPixel);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    const filterType = decompressed[rowStart];
    const currentRow = new Uint8Array(width * bytesPerPixel);
    
    for (let i = 0; i < width * bytesPerPixel; i++) {
      const raw = decompressed[rowStart + 1 + i];
      let val = raw;
      
      const a = i >= bytesPerPixel ? currentRow[i - bytesPerPixel] : 0; // Left
      const b = prevRow[i]; // Above
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0; // Upper left
      
      switch (filterType) {
        case 0: val = raw; break; // None
        case 1: val = (raw + a) & 0xff; break; // Sub
        case 2: val = (raw + b) & 0xff; break; // Up
        case 3: val = (raw + Math.floor((a + b) / 2)) & 0xff; break; // Average
        case 4: val = (raw + paethPredictor(a, b, c)) & 0xff; break; // Paeth
      }
      
      currentRow[i] = val;
    }

    // Convert to RGBA
    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      
      if (colorType === 0) { // Grayscale
        imageData[dstIdx] = imageData[dstIdx + 1] = imageData[dstIdx + 2] = currentRow[x];
        imageData[dstIdx + 3] = 255;
      } else if (colorType === 2) { // RGB
        imageData[dstIdx] = currentRow[x * 3];
        imageData[dstIdx + 1] = currentRow[x * 3 + 1];
        imageData[dstIdx + 2] = currentRow[x * 3 + 2];
        imageData[dstIdx + 3] = 255;
      } else if (colorType === 4) { // Grayscale + Alpha
        imageData[dstIdx] = imageData[dstIdx + 1] = imageData[dstIdx + 2] = currentRow[x * 2];
        imageData[dstIdx + 3] = currentRow[x * 2 + 1];
      } else if (colorType === 6) { // RGBA
        imageData[dstIdx] = currentRow[x * 4];
        imageData[dstIdx + 1] = currentRow[x * 4 + 1];
        imageData[dstIdx + 2] = currentRow[x * 4 + 2];
        imageData[dstIdx + 3] = currentRow[x * 4 + 3];
      }
    }
    
    prevRow = currentRow;
  }

  return { data: imageData, width, height };
}

// Convert ZPL to PNG using Labelary API
async function convertZplToPng(zpl: string, semaphore: Semaphore): Promise<Uint8Array | null> {
  await semaphore.acquire();
  
  try {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.labelary.com/v1/printers/8dpmm/labels/4x6/0/', {
          method: 'POST',
          headers: {
            'Accept': 'image/png',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: zpl,
        });

        if (response.status === 429) {
          const waitTime = RETRY_DELAYS[attempt] || 24000;
          console.warn(`⚠️ Rate limit 429 - waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        if (arrayBuffer.byteLength === 0) {
          throw new Error('Empty PNG received');
        }
        
        return new Uint8Array(arrayBuffer);
        
      } catch (error) {
        if (attempt < MAX_RETRIES - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        }
      }
    }
    
    return null;
  } finally {
    semaphore.release();
  }
}

// Process a single label: ZPL → PNG → Upscale → Base64
async function processLabel(zpl: string, semaphore: Semaphore, index: number): Promise<string | null> {
  const pngData = await convertZplToPng(zpl, semaphore);
  if (!pngData) {
    console.error(`❌ [${index}] Failed to get PNG from Labelary`);
    return null;
  }
  
  try {
    const decoded = decodePNG(pngData);
    const upscaled = upscaleNearestNeighbor(decoded.data, decoded.width, decoded.height, UPSCALE_FACTOR);
    const outputPng = encodePNG(upscaled.data, upscaled.width, upscaled.height);
    
    // Convert to base64
    let outputBase64 = '';
    const chunkSize = 32768;
    for (let i = 0; i < outputPng.length; i += chunkSize) {
      const chunk = outputPng.slice(i, i + chunkSize);
      outputBase64 += String.fromCharCode(...chunk);
    }
    console.log(`✅ [${index}] PNG processed (${(outputPng.length / 1024).toFixed(1)}KB)`);
    return btoa(outputBase64);
  } catch (error) {
    console.error(`❌ [${index}] Failed to process PNG:`, error.message);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // Authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 Authenticated user: ${user.id}`);

    // Parse request
    const { labels } = await req.json() as { labels: string[] };
    
    if (!labels || !Array.isArray(labels) || labels.length === 0) {
      return new Response(
        JSON.stringify({ error: 'labels array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (labels.length > MAX_LABELS_PER_REQUEST) {
      return new Response(
        JSON.stringify({ error: `Maximum ${MAX_LABELS_PER_REQUEST} labels per request` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 Processing ${labels.length} labels for HD conversion`);

    const semaphore = new Semaphore(LABELARY_CONCURRENT);
    
    // First pass: process all labels
    const results = await Promise.all(
      labels.map((zpl, index) => 
        processLabel(zpl, semaphore, index).then(result => ({ index, result }))
      )
    );

    // Build response preserving order and track failures
    const images: (string | null)[] = new Array(labels.length).fill(null);
    const failedIndices: number[] = [];
    let successCount = 0;
    
    for (const { index, result } of results) {
      images[index] = result;
      if (result) {
        successCount++;
      } else {
        failedIndices.push(index);
      }
    }

    // Second pass: retry failed labels with extra delay
    if (failedIndices.length > 0 && failedIndices.length <= 10) {
      console.log(`🔄 Retrying ${failedIndices.length} failed labels after cooldown...`);
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      for (const idx of failedIndices) {
        const retryResult = await processLabel(labels[idx], semaphore, idx);
        if (retryResult) {
          images[idx] = retryResult;
          successCount++;
          console.log(`✅ Retry success for label ${idx}`);
        }
      }
    }

    const elapsed = Date.now() - startTime;
    console.log(`✅ Completed: ${successCount}/${labels.length} labels in ${elapsed}ms`);

    return new Response(
      JSON.stringify({
        images,
        stats: {
          total: labels.length,
          success: successCount,
          failed: labels.length - successCount,
          processingTimeMs: elapsed
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
