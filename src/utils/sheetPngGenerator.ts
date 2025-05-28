
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { calculateSheetLayout, SHEET_DIMENSIONS } from './sheetLayout';

export const generateSheetFromPngs = async (
  pngBlobs: Blob[],
  config: SheetConfig
): Promise<Blob> => {
  const layouts = calculateSheetLayout(config, pngBlobs.length);
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Conversão de mm para pixels (assumindo 300 DPI para impressão)
  const mmToPixels = (mm: number) => Math.round(mm * 11.811); // 300 DPI = 11.811 pixels/mm
  
  const canvasWidth = mmToPixels(sheet.width);
  const canvasHeight = mmToPixels(sheet.height);
  
  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }
  
  // Fundo branco
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  // Carregar e posicionar cada PNG
  for (let i = 0; i < Math.min(pngBlobs.length, layouts.length); i++) {
    const layout = layouts[i];
    const pngBlob = pngBlobs[i];
    
    const img = new Image();
    const imageUrl = URL.createObjectURL(pngBlob);
    
    await new Promise((resolve, reject) => {
      img.onload = () => {
        const x = mmToPixels(layout.x);
        const y = mmToPixels(layout.y);
        const width = mmToPixels(layout.width);
        const height = mmToPixels(layout.height);
        
        ctx.drawImage(img, x, y, width, height);
        URL.revokeObjectURL(imageUrl);
        resolve(true);
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  }
  
  // Converter canvas para PDF
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      }
    }, 'image/png', 1.0);
  });
};

export const convertPngToPdf = async (pngBlob: Blob): Promise<Blob> => {
  // Criar um PDF simples com a imagem PNG
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Não foi possível criar contexto do canvas');
  }
  
  const img = new Image();
  const imageUrl = URL.createObjectURL(pngBlob);
  
  return new Promise((resolve, reject) => {
    img.onload = async () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      // Converter para PDF usando jsPDF ou similar
      // Por simplicidade, vamos retornar como PNG por enquanto
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(imageUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Falha ao converter PNG'));
        }
      }, 'image/png', 1.0);
    };
    img.onerror = reject;
    img.src = imageUrl;
  });
};
