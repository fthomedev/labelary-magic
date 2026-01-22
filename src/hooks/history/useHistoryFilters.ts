
import { useState, useMemo, useCallback } from 'react';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export type DateFilter = 'all' | 'today' | '7days' | '30days';
export type TypeFilter = 'all' | 'standard' | 'a4';

export function useHistoryFilters(records: ProcessingRecord[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');

  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      result = result.filter(record => {
        const recordDate = new Date(record.date);
        
        switch (dateFilter) {
          case 'today':
            return recordDate >= startOfDay;
          case '7days':
            const sevenDaysAgo = new Date(startOfDay);
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            return recordDate >= sevenDaysAgo;
          case '30days':
            const thirtyDaysAgo = new Date(startOfDay);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return recordDate >= thirtyDaysAgo;
          default:
            return true;
        }
      });
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(record => {
        const recordType = record.processingType || 'standard';
        if (typeFilter === 'a4') {
          // Include both 'a4' and 'hd' types for HD filter
          return recordType === 'a4' || recordType === 'hd';
        }
        return recordType === typeFilter;
      });
    }

    // Search query (by label count for now, since we don't have file names)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(record => {
        return record.labelCount.toString().includes(query);
      });
    }

    return result;
  }, [records, dateFilter, typeFilter, searchQuery]);

  const clearFilters = useCallback(() => {
    setSearchQuery('');
    setDateFilter('all');
    setTypeFilter('all');
  }, []);

  const hasActiveFilters = dateFilter !== 'all' || typeFilter !== 'all' || searchQuery.trim() !== '';

  return {
    searchQuery,
    setSearchQuery,
    dateFilter,
    setDateFilter,
    typeFilter,
    setTypeFilter,
    filteredRecords,
    clearFilters,
    hasActiveFilters,
  };
}
