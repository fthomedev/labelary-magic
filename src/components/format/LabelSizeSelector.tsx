import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Ruler } from 'lucide-react';
import {
  LabelSize,
  LABEL_SIZE_PRESETS,
  LABEL_SIZE_MIN_CM,
  LABEL_SIZE_MAX_CM,
  isValidLabelSize,
} from '@/types/labelSize';

interface LabelSizeSelectorProps {
  value: LabelSize;
  onChange: (size: LabelSize) => void;
}

function matchPresetId(size: LabelSize): string {
  const preset = LABEL_SIZE_PRESETS.find(
    p => Math.abs(p.widthCm - size.widthCm) < 0.01 && Math.abs(p.heightCm - size.heightCm) < 0.01
  );
  return preset ? preset.id : 'custom';
}

export function LabelSizeSelector({ value, onChange }: LabelSizeSelectorProps) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState<string>(() => matchPresetId(value));
  const [customW, setCustomW] = useState<string>(value.widthCm.toString());
  const [customH, setCustomH] = useState<string>(value.heightCm.toString());

  // Sync selectedId from external value changes ONLY when the user is not in custom mode.
  // Once in custom, stay there until the user explicitly clicks another preset —
  // otherwise typing values that happen to match a preset would unmount the inputs
  // mid-edit and steal focus.
  useEffect(() => {
    if (selectedId === 'custom') return;
    const next = matchPresetId(value);
    if (next !== selectedId) setSelectedId(next);
  }, [value, selectedId]);

  const handlePresetClick = (id: string) => {
    if (id === 'custom') {
      // Only initialize the custom inputs when entering custom mode, not on re-clicks.
      if (selectedId !== 'custom') {
        setCustomW(value.widthCm.toString());
        setCustomH(value.heightCm.toString());
        setSelectedId('custom');
      }
      return;
    }
    const preset = LABEL_SIZE_PRESETS.find(p => p.id === id);
    if (preset) {
      setSelectedId(id);
      onChange({ widthCm: preset.widthCm, heightCm: preset.heightCm });
    }
  };

  const commitCustom = (w: string, h: string) => {
    const widthCm = parseFloat(w.replace(',', '.'));
    const heightCm = parseFloat(h.replace(',', '.'));
    const next: LabelSize = { widthCm, heightCm };
    if (!isValidLabelSize(next)) return;
    // Avoid redundant onChange that triggers re-renders during focus transitions.
    if (next.widthCm === value.widthCm && next.heightCm === value.heightCm) return;
    onChange(next);
  };

  const customInvalid =
    selectedId === 'custom' &&
    !isValidLabelSize({
      widthCm: parseFloat(customW.replace(',', '.')),
      heightCm: parseFloat(customH.replace(',', '.')),
    });

  return (
    <div className="space-y-3">
      <div className="text-center flex items-center justify-center gap-1.5">
        <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
        <h4 className="text-sm font-medium text-foreground">{t('labelSize')}</h4>
      </div>

      <div className="grid grid-cols-3 gap-2 max-w-md mx-auto">
        {LABEL_SIZE_PRESETS.map(preset => {
          const isActive = selectedId === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => handlePresetClick(preset.id)}
              className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all hover:border-primary/60 hover:bg-accent/50 ${
                isActive
                  ? 'border-primary bg-primary/5 text-primary shadow-sm'
                  : 'border-border bg-background text-foreground'
              }`}
            >
              {preset.label}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => handlePresetClick('custom')}
          className={`rounded-lg border-2 px-2 py-2 text-xs font-medium transition-all hover:border-primary/60 hover:bg-accent/50 ${
            selectedId === 'custom'
              ? 'border-primary bg-primary/5 text-primary shadow-sm'
              : 'border-border bg-background text-foreground'
          }`}
        >
          {t('labelSizeCustom')}
        </button>
      </div>

      {selectedId === 'custom' && (
        <div className="max-w-md mx-auto space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="label-w" className="text-xs text-muted-foreground">
                {t('labelWidth')} (cm)
              </Label>
              <Input
                id="label-w"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={LABEL_SIZE_MIN_CM}
                max={LABEL_SIZE_MAX_CM}
                value={customW}
                onChange={e => setCustomW(e.target.value)}
                onBlur={() => commitCustom(customW, customH)}
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="label-h" className="text-xs text-muted-foreground">
                {t('labelHeight')} (cm)
              </Label>
              <Input
                id="label-h"
                type="number"
                inputMode="decimal"
                step="0.1"
                min={LABEL_SIZE_MIN_CM}
                max={LABEL_SIZE_MAX_CM}
                value={customH}
                onChange={e => setCustomH(e.target.value)}
                onBlur={() => commitCustom(customW, customH)}
                className="h-8 text-sm"
              />
            </div>
          </div>
          <p className={`text-xs ${customInvalid ? 'text-destructive' : 'text-muted-foreground'}`}>
            {t('labelSizeRangeHint', { min: LABEL_SIZE_MIN_CM, max: LABEL_SIZE_MAX_CM })}
          </p>
        </div>
      )}
    </div>
  );
}
