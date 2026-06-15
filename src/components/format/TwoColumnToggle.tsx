import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Columns2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TwoColumnToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function TwoColumnToggle({ enabled, onChange }: TwoColumnToggleProps) {
  const { t } = useTranslation();

  return (
    <label
      htmlFor="two-column-toggle"
      className="box-border flex w-full max-w-full cursor-pointer items-start gap-3 rounded-lg border border-border bg-background/50 px-3 py-3 sm:px-4"
    >
      <Checkbox
        id="two-column-toggle"
        checked={enabled}
        onCheckedChange={(v) => onChange(v === true)}
        className="mt-0.5 h-4 w-4 shrink-0"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-medium text-foreground">
          <Columns2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="min-w-0 break-words">{t('twoColumnToggle')}</span>
          <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
            Beta
          </span>
        </div>
        <p className="text-xs leading-snug text-muted-foreground break-words">
          {t('twoColumnHint')}
        </p>
      </div>
    </label>
  );
}
