export interface LabelSize {
  widthCm: number;
  heightCm: number;
}

export interface LabelSizePreset extends LabelSize {
  id: string;
  label: string;
}

export const LABEL_SIZE_PRESETS: LabelSizePreset[] = [
  { id: '10x15', label: '10 × 15 cm', widthCm: 10, heightCm: 15 },
  { id: '10x10', label: '10 × 10 cm', widthCm: 10, heightCm: 10 },
  { id: '7.5x5', label: '7,5 × 5 cm', widthCm: 7.5, heightCm: 5 },
  { id: '6x4', label: '6 × 4 cm', widthCm: 6, heightCm: 4 },
  { id: '4x4', label: '4 × 4 cm', widthCm: 4, heightCm: 4 },
];

export const DEFAULT_LABEL_SIZE: LabelSize = { widthCm: 10, heightCm: 15 };

export const LABEL_SIZE_MIN_CM = 2;
export const LABEL_SIZE_MAX_CM = 20;

export const LABEL_SIZE_STORAGE_KEY = 'zpl-label-size';

/** Convert cm → inches with 2 decimal places, formatted for Labelary URL (e.g. "3.94"). */
export function cmToInchesString(cm: number): string {
  return (cm / 2.54).toFixed(2);
}

/** Convert cm → mm for jsPDF page dimensions. */
export function cmToMm(cm: number): number {
  return cm * 10;
}

/** Build the Labelary size segment used in the URL, e.g. "3.94x5.91". */
export function buildLabelarySize(size: LabelSize): string {
  return `${cmToInchesString(size.widthCm)}x${cmToInchesString(size.heightCm)}`;
}

export function isValidLabelSize(size: LabelSize): boolean {
  return (
    Number.isFinite(size.widthCm) &&
    Number.isFinite(size.heightCm) &&
    size.widthCm >= LABEL_SIZE_MIN_CM &&
    size.widthCm <= LABEL_SIZE_MAX_CM &&
    size.heightCm >= LABEL_SIZE_MIN_CM &&
    size.heightCm <= LABEL_SIZE_MAX_CM
  );
}
