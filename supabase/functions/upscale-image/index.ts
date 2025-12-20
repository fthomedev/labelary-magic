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

// Simple PNG encoder for RGBA data
function encodePNG(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const signature = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  
  // IHDR chunk
  const ihdr = new Uint8Array(25);
  const ihdrData = new DataView(ihdr.buffer);
  ihdrData.setUint32(0, 13);
  ihdr[4] = 73; ihdr[5] = 72; ihdr[6] = 68; ihdr[7] = 82;
  ihdrData.setUint32(8, width);
  ihdrData.setUint32(12, height);
  ihdr[16] = 8;
  ihdr[17] = 6;
  ihdr[18] = 0;
  ihdr[19] = 0;
  ihdr[20] = 0;
  
  const ihdrCrc = crc32(ihdr.slice(4, 21));
  ihdrData.setUint32(21, ihdrCrc);
  
  // Prepare raw image data with filter bytes
  const rawData = new Uint8Array(height * (1 + width * 4));
  for (let y = 0; y < height; y++) {
    rawData[y * (1 + width * 4)] = 0;
    for (let x = 0; x < width; x++) {
      const srcIdx = (y * width + x) * 4;
      const dstIdx = y * (1 + width * 4) + 1 + x * 4;
      rawData[dstIdx] = data[srcIdx];
      rawData[dstIdx + 1] = data[srcIdx + 1];
      rawData[dstIdx + 2] = data[srcIdx + 2];
      rawData[dstIdx + 3] = data[srcIdx + 3];
    }
  }
  
  const compressed = deflateSync(rawData);
  
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

// Deflate using stored blocks (no compression)
function deflateSync(data: Uint8Array): Uint8Array {
  const chunks: Uint8Array[] = [];
  
  chunks.push(new Uint8Array([0x78, 0x9c]));
  
  const BLOCK_SIZE = 65535;
  let pos = 0;
  
  while (pos < data.length) {
    const remaining = data.length - pos;
    const blockLen = Math.min(BLOCK_SIZE, remaining);
    const isLast = pos + blockLen >= data.length;
    
    const header = new Uint8Array(5);
    header[0] = isLast ? 0x01 : 0x00;
    header[1] = blockLen & 0xff;
    header[2] = (blockLen >> 8) & 0xff;
    header[3] = ~blockLen & 0xff;
    header[4] = (~blockLen >> 8) & 0xff;
    
    chunks.push(header);
    chunks.push(data.slice(pos, pos + blockLen));
    
    pos += blockLen;
  }
  
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
function decodePNG(pngData: Uint8Array): { data: Uint8ClampedArray; width: number; height: number } {
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

  const totalCompressed = compressedData.reduce((sum, chunk) => sum + chunk.length, 0);
  const allCompressed = new Uint8Array(totalCompressed);
  let offset = 0;
  for (const chunk of compressedData) {
    allCompressed.set(chunk, offset);
    offset += chunk.length;
  }

  // Decompress using full inflate implementation
  const decompressed = inflateSync(allCompressed);

  let bytesPerPixel = 1;
  if (colorType === 2) bytesPerPixel = 3;
  else if (colorType === 4) bytesPerPixel = 2;
  else if (colorType === 6) bytesPerPixel = 4;

  const rowBytes = width * bytesPerPixel + 1;
  const imageData = new Uint8ClampedArray(width * height * 4);

  let prevRow = new Uint8Array(width * bytesPerPixel);
  
  for (let y = 0; y < height; y++) {
    const rowStart = y * rowBytes;
    const filterType = decompressed[rowStart];
    const currentRow = new Uint8Array(width * bytesPerPixel);
    
    for (let i = 0; i < width * bytesPerPixel; i++) {
      const raw = decompressed[rowStart + 1 + i];
      let val = raw;
      
      const a = i >= bytesPerPixel ? currentRow[i - bytesPerPixel] : 0;
      const b = prevRow[i];
      const c = i >= bytesPerPixel ? prevRow[i - bytesPerPixel] : 0;
      
      switch (filterType) {
        case 0: val = raw; break;
        case 1: val = (raw + a) & 0xff; break;
        case 2: val = (raw + b) & 0xff; break;
        case 3: val = (raw + Math.floor((a + b) / 2)) & 0xff; break;
        case 4: val = (raw + paethPredictor(a, b, c)) & 0xff; break;
      }
      
      currentRow[i] = val;
    }

    for (let x = 0; x < width; x++) {
      const dstIdx = (y * width + x) * 4;
      
      if (colorType === 0) {
        imageData[dstIdx] = imageData[dstIdx + 1] = imageData[dstIdx + 2] = currentRow[x];
        imageData[dstIdx + 3] = 255;
      } else if (colorType === 2) {
        imageData[dstIdx] = currentRow[x * 3];
        imageData[dstIdx + 1] = currentRow[x * 3 + 1];
        imageData[dstIdx + 2] = currentRow[x * 3 + 2];
        imageData[dstIdx + 3] = 255;
      } else if (colorType === 4) {
        imageData[dstIdx] = imageData[dstIdx + 1] = imageData[dstIdx + 2] = currentRow[x * 2];
        imageData[dstIdx + 3] = currentRow[x * 2 + 1];
      } else if (colorType === 6) {
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

// Full inflate implementation supporting compressed PNG data
function inflateSync(data: Uint8Array): Uint8Array {
  // Skip zlib header (2 bytes: CMF + FLG)
  let pos = 2;
  const output: number[] = [];
  
  // Fixed Huffman tables for BTYPE=01
  const fixedLitLenTable = buildFixedLitLenTable();
  const fixedDistTable = buildFixedDistTable();
  
  while (pos < data.length - 4) {
    const byte0 = data[pos];
    const bfinal = byte0 & 0x01;
    const btype = (byte0 >> 1) & 0x03;
    
    if (btype === 0) {
      // Stored block
      pos++;
      const len = data[pos] | (data[pos + 1] << 8);
      pos += 4;
      for (let i = 0; i < len; i++) {
        output.push(data[pos++]);
      }
    } else if (btype === 1) {
      // Fixed Huffman codes
      pos++;
      inflateBlock(data, pos, output, fixedLitLenTable, fixedDistTable, (newPos) => { pos = newPos; });
    } else if (btype === 2) {
      // Dynamic Huffman codes
      pos++;
      const { litLenTable, distTable, newPos } = readDynamicTables(data, pos);
      pos = newPos;
      inflateBlock(data, pos, output, litLenTable, distTable, (np) => { pos = np; });
    } else {
      throw new Error('Invalid block type');
    }
    
    if (bfinal) break;
  }
  
  return new Uint8Array(output);
}

// Build fixed literal/length Huffman table
function buildFixedLitLenTable(): Map<number, { symbol: number; bits: number }> {
  const table = new Map<number, { symbol: number; bits: number }>();
  
  // 0-143: 8 bits, codes 00110000-10111111
  for (let i = 0; i <= 143; i++) {
    const code = 0b00110000 + i;
    table.set((code << 8) | 8, { symbol: i, bits: 8 });
  }
  // 144-255: 9 bits, codes 110010000-111111111
  for (let i = 144; i <= 255; i++) {
    const code = 0b110010000 + (i - 144);
    table.set((code << 8) | 9, { symbol: i, bits: 9 });
  }
  // 256-279: 7 bits, codes 0000000-0010111
  for (let i = 256; i <= 279; i++) {
    const code = i - 256;
    table.set((code << 8) | 7, { symbol: i, bits: 7 });
  }
  // 280-287: 8 bits, codes 11000000-11000111
  for (let i = 280; i <= 287; i++) {
    const code = 0b11000000 + (i - 280);
    table.set((code << 8) | 8, { symbol: i, bits: 8 });
  }
  
  return table;
}

// Build fixed distance Huffman table
function buildFixedDistTable(): Map<number, { symbol: number; bits: number }> {
  const table = new Map<number, { symbol: number; bits: number }>();
  for (let i = 0; i < 32; i++) {
    table.set((i << 8) | 5, { symbol: i, bits: 5 });
  }
  return table;
}

// Bit reader helper
class BitReader {
  private data: Uint8Array;
  private bytePos: number;
  private bitPos: number;

  constructor(data: Uint8Array, startPos: number) {
    this.data = data;
    this.bytePos = startPos;
    this.bitPos = 0;
  }

  readBits(n: number): number {
    let result = 0;
    for (let i = 0; i < n; i++) {
      if (this.bytePos >= this.data.length) return result;
      const bit = (this.data[this.bytePos] >> this.bitPos) & 1;
      result |= bit << i;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        this.bytePos++;
      }
    }
    return result;
  }

  readBitsReverse(n: number): number {
    let result = 0;
    for (let i = 0; i < n; i++) {
      if (this.bytePos >= this.data.length) return result;
      const bit = (this.data[this.bytePos] >> this.bitPos) & 1;
      result = (result << 1) | bit;
      this.bitPos++;
      if (this.bitPos === 8) {
        this.bitPos = 0;
        this.bytePos++;
      }
    }
    return result;
  }

  getPos(): number {
    return this.bytePos;
  }
  
  alignToByte(): void {
    if (this.bitPos > 0) {
      this.bitPos = 0;
      this.bytePos++;
    }
  }
}

// Read dynamic Huffman tables
function readDynamicTables(data: Uint8Array, startPos: number): {
  litLenTable: number[];
  distTable: number[];
  newPos: number;
} {
  const reader = new BitReader(data, startPos);
  
  const hlit = reader.readBits(5) + 257;
  const hdist = reader.readBits(5) + 1;
  const hclen = reader.readBits(4) + 4;
  
  // Code length code lengths order
  const clOrder = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];
  const clLengths = new Array(19).fill(0);
  
  for (let i = 0; i < hclen; i++) {
    clLengths[clOrder[i]] = reader.readBits(3);
  }
  
  // Build code length Huffman tree
  const clTree = buildHuffmanTree(clLengths);
  
  // Read literal/length and distance code lengths
  const allLengths: number[] = [];
  while (allLengths.length < hlit + hdist) {
    const symbol = decodeSymbol(reader, clTree, 19);
    
    if (symbol < 16) {
      allLengths.push(symbol);
    } else if (symbol === 16) {
      const repeat = reader.readBits(2) + 3;
      const lastLen = allLengths[allLengths.length - 1] || 0;
      for (let i = 0; i < repeat; i++) allLengths.push(lastLen);
    } else if (symbol === 17) {
      const repeat = reader.readBits(3) + 3;
      for (let i = 0; i < repeat; i++) allLengths.push(0);
    } else if (symbol === 18) {
      const repeat = reader.readBits(7) + 11;
      for (let i = 0; i < repeat; i++) allLengths.push(0);
    }
  }
  
  const litLenLengths = allLengths.slice(0, hlit);
  const distLengths = allLengths.slice(hlit, hlit + hdist);
  
  return {
    litLenTable: buildHuffmanTree(litLenLengths),
    distTable: buildHuffmanTree(distLengths),
    newPos: reader.getPos()
  };
}

// Build Huffman tree from code lengths
function buildHuffmanTree(lengths: number[]): number[] {
  const maxLen = Math.max(...lengths, 1);
  const blCount = new Array(maxLen + 1).fill(0);
  
  for (const len of lengths) {
    if (len > 0) blCount[len]++;
  }
  
  const nextCode = new Array(maxLen + 1).fill(0);
  let code = 0;
  for (let bits = 1; bits <= maxLen; bits++) {
    code = (code + blCount[bits - 1]) << 1;
    nextCode[bits] = code;
  }
  
  // Create lookup table: tree[code] = symbol
  const tree: number[] = new Array(1 << (maxLen + 1)).fill(-1);
  
  for (let symbol = 0; symbol < lengths.length; symbol++) {
    const len = lengths[symbol];
    if (len > 0) {
      const c = nextCode[len]++;
      // Store with length info: (code << 5) | length
      tree[(c << 5) | len] = symbol;
    }
  }
  
  return tree;
}

// Decode a symbol using Huffman tree
function decodeSymbol(reader: BitReader, tree: number[], maxSymbol: number): number {
  let code = 0;
  for (let len = 1; len <= 15; len++) {
    code = (code << 1) | reader.readBitsReverse(1);
    const idx = (code << 5) | len;
    if (tree[idx] !== undefined && tree[idx] >= 0 && tree[idx] < maxSymbol) {
      return tree[idx];
    }
  }
  throw new Error('Invalid Huffman code');
}

// Length and distance base values and extra bits
const lengthBase = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const lengthExtra = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const distBase = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const distExtra = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];

// Inflate a compressed block
function inflateBlock(
  data: Uint8Array,
  startPos: number,
  output: number[],
  litLenTable: number[] | Map<number, { symbol: number; bits: number }>,
  distTable: number[] | Map<number, { symbol: number; bits: number }>,
  setPos: (pos: number) => void
): void {
  const reader = new BitReader(data, startPos);
  
  while (true) {
    const symbol = Array.isArray(litLenTable) 
      ? decodeSymbol(reader, litLenTable, 286)
      : decodeSymbolFromMap(reader, litLenTable);
    
    if (symbol < 256) {
      output.push(symbol);
    } else if (symbol === 256) {
      break;
    } else {
      // Length/distance pair
      const lenIdx = symbol - 257;
      const length = lengthBase[lenIdx] + reader.readBits(lengthExtra[lenIdx]);
      
      const distSymbol = Array.isArray(distTable)
        ? decodeSymbol(reader, distTable, 30)
        : decodeSymbolFromMap(reader, distTable);
      
      const distance = distBase[distSymbol] + reader.readBits(distExtra[distSymbol]);
      
      // Copy from output buffer
      const srcStart = output.length - distance;
      for (let i = 0; i < length; i++) {
        output.push(output[srcStart + i]);
      }
    }
  }
  
  setPos(reader.getPos());
}

function decodeSymbolFromMap(reader: BitReader, table: Map<number, { symbol: number; bits: number }>): number {
  let code = 0;
  for (let len = 1; len <= 15; len++) {
    code = (code << 1) | reader.readBitsReverse(1);
    const key = (code << 8) | len;
    const entry = table.get(key);
    if (entry) {
      return entry.symbol;
    }
  }
  throw new Error('Invalid Huffman code in map');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const { imageBase64, scale = 3 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('imageBase64 is required');
    }

    console.log(`📥 Received image for ${scale}x upscaling`);
    
    const binaryString = atob(imageBase64);
    const inputBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      inputBytes[i] = binaryString.charCodeAt(i);
    }
    
    console.log(`📊 Input PNG size: ${(inputBytes.length / 1024).toFixed(1)}KB`);
    
    const decoded = decodePNG(inputBytes);
    console.log(`📐 Input dimensions: ${decoded.width}x${decoded.height}`);
    
    const upscaled = upscaleNearestNeighbor(decoded.data, decoded.width, decoded.height, scale);
    console.log(`📐 Output dimensions: ${upscaled.width}x${upscaled.height}`);
    
    const outputPng = encodePNG(upscaled.data, upscaled.width, upscaled.height);
    console.log(`📊 Output PNG size: ${(outputPng.length / 1024).toFixed(1)}KB`);
    
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
