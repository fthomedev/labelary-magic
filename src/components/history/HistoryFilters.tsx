
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export type DateFilter = 'all' | 'today' | '7days' | '30days';
export type TypeFilter = 'all' | 'standard' | 'a4';

interface HistoryFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  dateFilter: DateFilter;
  onDateFilterChange: (filter: DateFilter) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (filter: TypeFilter) => void;
}

export function HistoryFilters({
  searchQuery,
  onSearchChange,
  dateFilter,
  onDateFilterChange,
  typeFilter,
  onTypeFilterChange,
}: HistoryFiltersProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b bg-background">
      <Select value={dateFilter} onValueChange={(v) => onDateFilterChange(v as DateFilter)}>
        <SelectTrigger className="h-7 w-auto min-w-[100px] text-xs">
          <SelectValue placeholder={t('historyFilters.allDates')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">{t('historyFilters.allDates')}</SelectItem>
          <SelectItem value="today" className="text-xs">{t('historyFilters.today')}</SelectItem>
          <SelectItem value="7days" className="text-xs">{t('historyFilters.last7Days')}</SelectItem>
          <SelectItem value="30days" className="text-xs">{t('historyFilters.last30Days')}</SelectItem>
        </SelectContent>
      </Select>

      <Select value={typeFilter} onValueChange={(v) => onTypeFilterChange(v as TypeFilter)}>
        <SelectTrigger className="h-7 w-auto min-w-[90px] text-xs">
          <SelectValue placeholder={t('historyFilters.allTypes')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all" className="text-xs">{t('historyFilters.allTypes')}</SelectItem>
          <SelectItem value="standard" className="text-xs">{t('historyFilters.standard')}</SelectItem>
          <SelectItem value="a4" className="text-xs">{t('historyFilters.hd')}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
