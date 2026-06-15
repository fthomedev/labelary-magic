import React from 'react';
import { Switch } from '@/components/ui/switch';
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
    <div className="box-border w-full max-w-full overflow-hidden rounded-lg border border-border bg-background/50 px-4 py-3">
      <div className="flex w-full min-w-0 items-center gap-4">
        <Columns2 className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        <Label
          htmlFor="two-column-toggle"
          className="min-w-0 flex-1 truncate text-sm font-medium text-foreground cursor-pointer"
        >
          {t('twoColumnToggle')}
        </Label>
        <Switch
          id="two-column-toggle"
          checked={enabled}
          onCheckedChange={onChange}
          className="shrink-0"
        />
      </div>
      <p className="mt-2 pl-8 pr-2 text-xs leading-snug text-muted-foreground">
        {t('twoColumnHint')}
      </p>
    </div>
  );
}
