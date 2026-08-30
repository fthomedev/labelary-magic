import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum image size: 5MB (accounting for base64 overhead ~1.37x)
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024 * 1.37;
const MIN_SCALE = 1;
const MAX_SCALE = 4;

interface DecodedPng {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  colorType: number;
  bitDepth: number;
}

// ---------------------------------------------------------------------------
// zlib helpers backed by the runtime's native streams (real DEFLATE support)
// ---------------------------------------------------------------------------

async function streamThrough(data: Uint8Array, stream: TransformStream<Uint8Array, Uint8Array>): Promise<Uint8Array> {
  const writer = stream.writable.getWriter();
  void writer.write(data).then(() => writer.close()).catch(() => { /* surfaced by reader */ });

  const reader = stream.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.length;
    }
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return out;
}

/** Inflate a zlib stream (PNG IDAT payload). */
async function inflateZlib(data: Uint8Array): Promise<Uint8Array> {
  try {
    return await streamThrough(data, new DecompressionStream('deflate'));
  } catch {
    // Some encoders emit raw deflate without the zlib wrapper.
    return await streamThrough(data, new DecompressionStream('deflate-raw'));
  }
}

/** Deflate to a zlib stream (PNG IDAT payload). */
async function deflateZlib(data: Uint8Array): Promise<Uint8Array> {
  return await streamThrough(data, new CompressionStream('deflate'));
}

// Nearest Neighbor upscaling - perfect for barcodes (sharp edges, no blur)
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
    const srcY = Math.floor(y / scale);
    for (let x = 0; x < outputWidth; x++) {
      const srcX = Math.floor(x / scale);

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

// PNG encoder for RGBA data
async function encodePNG(data: Uint8ClampedArray, width: number, height: number): Promise<Uint8Array> {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = new Uint8Array(25);
  const ihdrData = new DataView(ihdr.buffer);
  ihdrData.setUint32(0, 13); // Length
  ihdr[4] = 73; ihdr[5] = 72; ihdr[6] = 68; ihdr[7] = 82; // "IHDR"
  ihdrData.setUint32(8, width);
  ihdrData.setUint32(12, height);
  ihdr[16] = 8; // Bit depth
  ihdr[17] = 6; // Color type (RGBA)
  ihdr[18] = 0; // Compression
  ihdr[19] = 0; // Filter
  ihdr[20] = 0; // Interlace
  ihdrData.setUint32(21, crc32(ihdr.slice(4, 21)));

  // Raw image data with filter bytes
  const rowBytes = 1 + width * 4;
  const rawData = new Uint8Array(height * rowBytes);
  for (let y = 0; y < height; y++) {
    rawData[y * rowBytes] = 0; // Filter type: None
    rawData.set(data.subarray(y * width * 4, (y + 1) * width * 4), y * rowBytes + 1);
  }

  const compressed = await deflateZlib(rawData);

  // IDAT chunk
  const idat = new Uint8Array(12 + compressed.length);
  const idatData = new DataView(idat.buffer);
  idatData.setUint32(0, compressed.length);
  idat[4] = 73; idat[5] = 68; idat[6] = 65; idat[7] = 84; // "IDAT"
  idat.set(compressed, 8);
  idatData.setUint32(8 + compressed.length, crc32(idat.slice(4, 8 + compressed.length)));

  // IEND chunk
  const iend = new Uint8Array(12);
  const iendData = new DataView(iend.buffer);
  iendData.setUint32(0, 0);
  iend[4] = 73; iend[5] = 69; iend[6] = 78; iend[7] = 68; // "IEND"
  iendData.setUint32(8, crc32(iend.slice(4, 8)));

  const png = new Uint8Array(signature.length + ihdr.length + idat.length + iend.length);
  let offset = 0;
  png.set(signature, offset); offset += signature.length;
  png.set(ihdr, offset); offset += ihdr.length;
  png.set(idat, offset); offset += idat.length;
  png.set(iend, offset);

  return png;
}

// CRC32 implementation for PNG
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

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

/** Number of channels per pixel for a given PNG color type. */
function channelsForColorType(colorType: number): number {
  switch (colorType) {
    case 0: return 1; // Grayscale
    case 2: return 3; // RGB
    case 3: return 1; // Palette index
    case 4: return 2; // Grayscale + Alpha
    case 6: return 4; // RGBA
    default: throw new Error(`Unsupported PNG color type: ${colorType}`);
  }
}

/** Read the sample at `index` from a packed scanline with bit depth < 8. */
function readPackedSample(row: Uint8Array, index: number, bitDepth: number): number {
  const samplesPerByte = 8 / bitDepth;
  const byte = row[Math.floor(index / samplesPerByte)];
  const shift = 8 - bitDepth * ((index % samplesPerByte) + 1);
  const mask = (1 << bitDepth) - 1;
  return (byte >> shift) & mask;
}

// PNG decoder - extracts RGBA data from PNG
async function decodePNG(pngData: Uint8Array): Promise<DecodedPng> {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (pngData[i] !== signature[i]) {
      throw new Error('Invalid PNG signature');
    }
  }

  let width = 0, height = 0, bitDepth = 0, colorType = 0, interlace = 0;
  let palette: Uint8Array | null = null;
  let paletteAlpha: Uint8Array | null = null;
  const compressedData: Uint8Array[] = [];
  let pos = 8;

  while (pos + 8 <= pngData.length) {
    const length = (pngData[pos] << 24) | (pngData[pos + 1] << 16) | (pngData[pos + 2] << 8) | pngData[pos + 3];
    const type = String.fromCharCode(pngData[pos + 4], pngData[pos + 5], pngData[pos + 6], pngData[pos + 7]);

    if (type === 'IHDR') {
      width = (pngData[pos + 8] << 24) | (pngData[pos + 9] << 16) | (pngData[pos + 10] << 8) | pngData[pos + 11];
      height = (pngData[pos + 12] << 24) | (pngData[pos + 13] << 16) | (pngData[pos + 14] << 8) | pngData[pos + 15];
      bitDepth = pngData[pos + 16];
      colorType = pngData[pos + 17];
      interlace = pngData[pos + 20];
    } else if (type === 'PLTE') {
      palette = pngData.slice(pos + 8, pos + 8 + length);
    } else if (type === 'tRNS') {
      paletteAlpha = pngData.slice(pos + 8, pos + 8 + length);
    } else if (type === 'IDAT') {
      compressedData.push(pngData.slice(pos + 8, pos + 8 + length));
    } else if (type === 'IEND') {
      break;
    }

    pos += 12 + length;
  }

  if (width <= 0 || height <= 0) throw new Error('Invalid PNG dimensions');
  if (interlace !== 0) throw new Error('Interlaced PNG is not supported');
  if (bitDepth === 16) throw new Error('16-bit PNG is not supported');
  if (![1, 2, 4, 8].includes(bitDepth)) throw new Error(`Unsupported PNG bit depth: ${bitDepth}`);
  if (colorType === 3 && !palette) throw new Error('Palette PNG without PLTE chunk');
  if (bitDepth < 8 && (colorType === 2 || colorType === 4 || colorType === 6)) {
    throw new Error(`Unsupported PNG combination: color type ${colorType} with bit depth ${bitDepth}`);
  }
  if (compressedData.length === 0) throw new Error('PNG has no image data');

  // Combine IDAT chunks
  const totalCompressed = compressedData.reduce((sum, chunk) => sum + chunk.length, 0);
  const allCompressed = new Uint8Array(totalCompressed);
  let offset = 0;
  for (const chunk of compressedData) {
    allCompressed.set(chunk, offset);
    offset += chunk.length;
  }

  const decompressed = await inflateZlib(allCompressed);

  const channels = channelsForColorType(colorType);
  const bitsPerPixel = channels * bitDepth;
  const bytesPerPixel = Math.max(1, Math.ceil(bitsPerPixel / 8));
  const scanlineBytes = Math.ceil((width * bitsPerPixel) / 8);
  const rowBytes = scanlineBytes + 1; // +1 for the filter byte

  if (decompressed.length < rowBytes * height) {
    throw new Error(`Truncated PNG data: expected ${rowBytes * height} bytes, got ${decompressed.length}`);
  }

  const imageData = new Uint8ClampedArray(width * height * 4);
  let prevRow = new Uint8Array(scanlineBytes);
  const maxSample = (1 << bitDepth) - 1;

  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    const filterType = decompressed[rowStart];
    const currentRow = new Uint8Array(scanlineBytes);

    for (let i = 0; i < scanlineBytes; i++) {
      const raw = decompressed[rowStart + 1 + i];
      const a = i >= bytesPerPixel ? currentRow[i - bytesPerPixel] : 0; // Left
      const b = prevRow[i]; // Above
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0; // Upper left

      let val = raw;
      switch (filterType) {
        case 0: val = raw; break; // None
        case 1: val = (raw + a) & 0xff; break; // Sub
        case 2: val = (raw + b) & 0xff; break; // Up
        case 3: val = (raw + ((a + b) >> 1)) & 0xff; break; // Average
        case 4: val = (raw + paethPredictor(a, b, c)) & 0xff; break; // Paeth
        default: throw new Error(`Unsupported PNG filter type: ${filterType}`);
      }

      currentRow[i] = val;
    }

    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;

      if (colorType === 3) { // Palette
        const index = bitDepth === 8 ? currentRow[x] : readPackedSample(currentRow, x, bitDepth);
        const p = index * 3;
        imageData[dstIdx] = palette![p];
        imageData[dstIdx + 1] = palette![p + 1];
        imageData[dstIdx + 2] = palette![p + 2];
        imageData[dstIdx + 3] = paletteAlpha && index < paletteAlpha.length ? paletteAlpha[index] : 255;
      } else if (colorType === 0) { // Grayscale
        const sample = bitDepth === 8 ? currentRow[x] : readPackedSample(currentRow, x, bitDepth);
        const gray = bitDepth === 8 ? sample : Math.round((sample / maxSample) * 255);
        imageData[dstIdx] = imageData[dstIdx + 1] = imageData[dstIdx + 2] = gray;
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

  return { data: imageData, width, height, colorType, bitDepth };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    // ========== AUTHENTICATION ==========
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with the user's auth token
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message || 'No user found');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`🔐 Authenticated user: ${user.id}`);

    // ========== INPUT VALIDATION ==========
    const { imageBase64, scale = 2 } = await req.json();

    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    // Validate image size (prevent DoS with large images)
    if (imageBase64.length > MAX_IMAGE_SIZE_BYTES) {
      console.error(`❌ Image too large: ${(imageBase64.length / 1024 / 1024).toFixed(2)}MB`);
      return new Response(
        JSON.stringify({ error: 'Image too large (max 5MB)' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate scale parameter
    if (typeof scale !== 'number' || scale < MIN_SCALE || scale > MAX_SCALE) {
      console.error(`❌ Invalid scale: ${scale}`);
      return new Response(
        JSON.stringify({ error: `Scale must be between ${MIN_SCALE} and ${MAX_SCALE}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`📥 Received image for ${scale}x upscaling`);

    // Decode base64 to Uint8Array
    const binaryString = atob(imageBase64);
    const inputBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      inputBytes[i] = binaryString.charCodeAt(i);
    }

    console.log(`📊 Input PNG size: ${(inputBytes.length / 1024).toFixed(1)}KB`);

    // Decode PNG
    const decoded = await decodePNG(inputBytes);
    console.log(`📐 Input dimensions: ${decoded.width}x${decoded.height} (colorType ${decoded.colorType}, ${decoded.bitDepth}-bit)`);

    // Upscale with Nearest Neighbor
    const upscaled = upscaleNearestNeighbor(decoded.data, decoded.width, decoded.height, scale);
    console.log(`📐 Output dimensions: ${upscaled.width}x${upscaled.height}`);

    // Encode back to PNG
    const outputPng = await encodePNG(upscaled.data, upscaled.width, upscaled.height);
    console.log(`📊 Output PNG size: ${(outputPng.length / 1024).toFixed(1)}KB`);

    // Convert to base64
    let outputBase64 = '';
    const chunkSize = 32768;
    for (let i = 0; i < outputPng.length; i += chunkSize) {
      const chunk = outputPng.subarray(i, i + chunkSize);
      outputBase64 += String.fromCharCode(...chunk);
    }
    outputBase64 = btoa(outputBase64);

    const elapsed = Date.now() - startTime;
    console.log(`✅ Upscale completed in ${elapsed}ms for user ${user.id}`);

    return new Response(
      JSON.stringify({
        upscaledImage: outputBase64,
        originalSize: { width: decoded.width, height: decoded.height, colorType: decoded.colorType, bitDepth: decoded.bitDepth },
        upscaledSize: { width: upscaled.width, height: upscaled.height },
        processingTimeMs: elapsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('❌ Upscale error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
