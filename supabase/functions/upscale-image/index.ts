import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    for (let x = 0; x < outputWidth; x++) {
      // Find the nearest source pixel
      const srcX = Math.floor(x / scale);
      const srcY = Math.floor(y / scale);
      
      const srcIndex = (srcY * inputWidth + srcX) * 4;
      const dstIndex = (y * outputWidth + x) * 4;
      
      // Copy RGBA values
      outputData[dstIndex] = inputData[srcIndex];
      outputData[dstIndex + 1] = inputData[srcIndex + 1];
      outputData[dstIndex + 2] = inputData[srcIndex + 2];
      outputData[dstIndex + 3] = inputData[srcIndex + 3];
    }
  }

  return { data: outputData, width: outputWidth, height: outputHeight };
}

// Simple PNG encoder for RGBA data
function encodePNG(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  // PNG signature
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
  
  // Calculate CRC for IHDR
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
  
  // Compress with deflate (using Deno's built-in compression)
  const compressed = deflateSync(rawData);
  
  // IDAT chunk
  const idat = new Uint8Array(12 + compressed.length);
  const idatData = new DataView(idat.buffer);
  idatData.setUint32(0, compressed.length);
  idat[4] = 73; idat[5] = 68; idat[6] = 65; idat[7] = 84; // "IDAT"
  idat.set(compressed, 8);
  const idatCrc = crc32(idat.slice(4, 8 + compressed.length));
  idatData.setUint32(8 + compressed.length, idatCrc);
  
  // IEND chunk
  const iend = new Uint8Array(12);
  const iendData = new DataView(iend.buffer);
  iendData.setUint32(0, 0); // Length
  iend[4] = 73; iend[5] = 69; iend[6] = 78; iend[7] = 68; // "IEND"
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

// Simple deflate implementation using zlib-style compression
function deflateSync(data: Uint8Array): Uint8Array {
  // Use CompressionStream API available in Deno
  const chunks: Uint8Array[] = [];
  
  // zlib header
  chunks.push(new Uint8Array([0x78, 0x9c]));
  
  // Store blocks (no compression for simplicity - works but larger file)
  const BLOCK_SIZE = 65535;
  let pos = 0;
  
  while (pos < data.length) {
    const remaining = data.length - pos;
    const blockLen = Math.min(BLOCK_SIZE, remaining);
    const isLast = pos + blockLen >= data.length;
    
    const header = new Uint8Array(5);
    header[0] = isLast ? 0x01 : 0x00; // BFINAL + BTYPE=00 (stored)
    header[1] = blockLen & 0xff;
    header[2] = (blockLen >> 8) & 0xff;
    header[3] = ~blockLen & 0xff;
    header[4] = (~blockLen >> 8) & 0xff;
    
    chunks.push(header);
    chunks.push(data.slice(pos, pos + blockLen));
    
    pos += blockLen;
  }
  
  // Adler-32 checksum
  let a = 1, b = 0;
  for (let i = 0; i < data.length; i++) {
    a = (a + data[i]) % 65521;
    b = (b + a) % 65521;
  }
  const adler = ((b << 16) | a) >>> 0;
  const adlerBytes = new Uint8Array(4);
  adlerBytes[0] = (adler >> 24) & 0xff;
  adlerBytes[1] = (adler >> 16) & 0xff;
  adlerBytes[2] = (adler >> 8) & 0xff;
  adlerBytes[3] = adler & 0xff;
  chunks.push(adlerBytes);
  
  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

// PNG decoder - extracts RGBA data from PNG
async function decodePNG(pngData: Uint8Array): Promise<{ data: Uint8ClampedArray; width: number; height: number }> {
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

  // Read chunks
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

  // Combine IDAT chunks
  const totalCompressed = compressedData.reduce((sum, chunk) => sum + chunk.length, 0);
  const allCompressed = new Uint8Array(totalCompressed);
  let offset = 0;
  for (const chunk of compressedData) {
    allCompressed.set(chunk, offset);
    offset += chunk.length;
  }

  // Decompress using async inflate
  const decompressed = await inflateAsync(allCompressed);

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

function paethPredictor(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

async function inflateAsync(data: Uint8Array): Promise<Uint8Array> {
  // Skip zlib header (2 bytes) and adler32 checksum (4 bytes at end)
  const deflateData = data.slice(2, data.length - 4);
  
  // Use DecompressionStream API (available in Deno)
  const stream = new DecompressionStream('deflate-raw');
  const writer = stream.writable.getWriter();
  const reader = stream.readable.getReader();
  
  // Write compressed data
  writer.write(deflateData);
  writer.close();
  
  // Read decompressed data
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  
  // Combine chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  
  return result;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { imageBase64, scale = 2 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('imageBase64 is required');
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
    console.log(`📐 Input dimensions: ${decoded.width}x${decoded.height}`);
    
    // Upscale with Nearest Neighbor
    const upscaled = upscaleNearestNeighbor(decoded.data, decoded.width, decoded.height, scale);
    console.log(`📐 Output dimensions: ${upscaled.width}x${upscaled.height}`);
    
    // Encode back to PNG
    const outputPng = encodePNG(upscaled.data, upscaled.width, upscaled.height);
    console.log(`📊 Output PNG size: ${(outputPng.length / 1024).toFixed(1)}KB`);
    
    // Convert to base64
    let outputBase64 = '';
    const chunkSize = 32768;
    for (let i = 0; i < outputPng.length; i += chunkSize) {
      const chunk = outputPng.slice(i, i + chunkSize);
      outputBase64 += String.fromCharCode(...chunk);
    }
    outputBase64 = btoa(outputBase64);
    
    const elapsed = Date.now() - startTime;
    console.log(`✅ Upscale completed in ${elapsed}ms`);
    
    return new Response(
      JSON.stringify({ 
        upscaledImage: outputBase64,
        originalSize: { width: decoded.width, height: decoded.height },
        upscaledSize: { width: upscaled.width, height: upscaled.height },
        processingTimeMs: elapsed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('❌ Upscale error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
