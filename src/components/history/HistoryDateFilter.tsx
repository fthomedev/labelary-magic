
import React from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface HistoryDateFilterProps {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
}

export function HistoryDateFilter({ value, onChange }: HistoryDateFilterProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === 'pt-BR' ? ptBR : enUS;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-9 text-sm bg-muted/30 border-muted-foreground/20 hover:bg-muted/50",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            <span className="flex-1">
              {format(value, "dd MMM, yyyy", { locale })}
            </span>
          ) : (
            <span className="flex-1">{t('searchByDate')}</span>
          )}
          {value && (
            <span
              role="button"
              onClick={handleClear}
              className="ml-2 h-5 w-5 rounded-full hover:bg-muted flex items-center justify-center"
            >
              <X className="h-3 w-3" />
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          locale={locale}
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
