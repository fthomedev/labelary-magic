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
    <div className="box-border w-full max-w-full rounded-lg border border-border bg-background/50 px-4 py-3">
      <div className="flex w-full min-w-0 items-start gap-3">
        <Checkbox
          id="two-column-toggle"
          checked={enabled}
          onCheckedChange={(v) => onChange(v === true)}
          className="mt-0.5 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <Label
            htmlFor="two-column-toggle"
            className="flex items-center gap-2 text-sm font-medium text-foreground cursor-pointer"
          >
            <Columns2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            {t('twoColumnToggle')}
          </Label>
          <p className="mt-1 text-xs leading-snug text-muted-foreground">
            {t('twoColumnHint')}
          </p>
        </div>
      </div>
    </div>
  );
}
