
import { SheetConfig } from '@/components/sheet/SheetSettings';
import { calculateSheetLayout, SHEET_DIMENSIONS } from './sheetLayout';

export const generateSheetZPL = (
  labels: string[],
  config: SheetConfig
): string => {
  if (!config.enabled) {
    return labels.join('');
  }

  const layouts = calculateSheetLayout(config, labels.length);
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Conversão de mm para dots (8 dpmm como no Labelary)
  const mmToDots = (mm: number) => Math.round(mm * 8);
  
  let sheetZPL = `^XA\n`;
  
  // Configurar tamanho da página
  sheetZPL += `^PW${mmToDots(sheet.width)}\n`;
  sheetZPL += `^LL${mmToDots(sheet.height)}\n`;
  
  // Adicionar cada etiqueta na posição calculada
  layouts.forEach((layout, index) => {
    if (index < labels.length) {
      let labelContent = labels[index]
        .replace(/^\^XA\s*/, '') // Remove ^XA inicial
        .replace(/\^XZ\s*$/, '') // Remove ^XZ final
        .trim();
      
      // Posicionar a etiqueta usando ^FO (Field Origin)
      sheetZPL += `^FO${mmToDots(layout.x)},${mmToDots(layout.y)}\n`;
      
      // Adicionar o conteúdo da etiqueta
      sheetZPL += labelContent + '\n';
    }
  });
  
  sheetZPL += `^XZ`;
  
  return sheetZPL;
};

export const splitLabelsIntoSheets = (
  labels: string[],
  config: SheetConfig
): string[] => {
  if (!config.enabled) {
    return labels;
  }

  const layouts = calculateSheetLayout(config, labels.length);
  const maxLabelsPerSheet = layouts.length;
  
  const sheets: string[] = [];
  
  for (let i = 0; i < labels.length; i += maxLabelsPerSheet) {
    const sheetLabels = labels.slice(i, i + maxLabelsPerSheet);
    const sheetZPL = generateSheetZPL(sheetLabels, config);
    sheets.push(sheetZPL);
  }
  
  return sheets;
};
