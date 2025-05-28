
import { SheetConfig } from '@/components/sheet/SheetSettings';

export interface SheetDimensions {
  width: number;
  height: number;
}

export interface LabelLayout {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Dimensões padrão das folhas em mm
export const SHEET_DIMENSIONS: Record<'A4' | 'A5', SheetDimensions> = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 }
};

// Dimensões das etiquetas otimizadas para máximo aproveitamento
export const LABEL_SIZE = {
  width: 85,  // Otimizado para caber mais etiquetas
  height: 120 // Otimizado para caber mais etiquetas
};

export const calculateSheetLayout = (
  config: SheetConfig,
  labelCount: number
): LabelLayout[] => {
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  // Área útil da folha (descontando margens)
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  // Quantas etiquetas cabem por linha e coluna
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (LABEL_SIZE.height + config.labelSpacing)
  );
  
  const maxLabelsPerSheet = labelsPerRow * labelsPerColumn;
  const actualLabelCount = Math.min(labelCount, maxLabelsPerSheet);
  
  console.log(`Sheet layout: ${labelsPerRow}x${labelsPerColumn} = ${maxLabelsPerSheet} max labels, placing ${actualLabelCount}`);
  
  const layouts: LabelLayout[] = [];
  
  for (let i = 0; i < actualLabelCount; i++) {
    const row = Math.floor(i / labelsPerRow);
    const col = i % labelsPerRow;
    
    const x = config.marginLeft + col * (LABEL_SIZE.width + config.labelSpacing);
    const y = config.marginTop + row * (LABEL_SIZE.height + config.labelSpacing);
    
    layouts.push({
      x,
      y,
      width: LABEL_SIZE.width,
      height: LABEL_SIZE.height
    });
  }
  
  return layouts;
};

export const getMaxLabelsPerSheet = (config: SheetConfig): number => {
  const sheet = SHEET_DIMENSIONS[config.sheetSize];
  
  const usableWidth = sheet.width - config.marginLeft - config.marginRight;
  const usableHeight = sheet.height - config.marginTop - config.marginBottom;
  
  const labelsPerRow = Math.floor(
    (usableWidth + config.labelSpacing) / (LABEL_SIZE.width + config.labelSpacing)
  );
  const labelsPerColumn = Math.floor(
    (usableHeight + config.labelSpacing) / (LABEL_SIZE.height + config.labelSpacing)
  );
  
  return labelsPerRow * labelsPerColumn;
};
