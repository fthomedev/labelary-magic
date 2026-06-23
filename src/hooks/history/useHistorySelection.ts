
import { useState, useCallback } from 'react';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistorySelection(records: ProcessingRecord[], totalRecords: number = 0) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isAllHistorySelected, setIsAllHistorySelected] = useState(false);

  const selectRecord = useCallback((id: string, selected: boolean) => {
    setIsAllHistorySelected(false);
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (selected) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }
      return newSet;
    });
  }, []);

  const selectAll = useCallback((selected: boolean) => {
    setIsAllHistorySelected(false);
    if (selected) {
      setSelectedIds(new Set(records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [records]);

  const selectAllHistory = useCallback(() => {
    setIsAllHistorySelected(true);
    setSelectedIds(new Set(records.map(r => r.id)));
  }, [records]);

  const clearSelection = useCallback(() => {
    setIsAllHistorySelected(false);
    setSelectedIds(new Set());
  }, []);

  const getSelectedRecords = useCallback(() => {
    return records.filter(r => selectedIds.has(r.id));
  }, [records, selectedIds]);

  const effectiveCount = isAllHistorySelected ? totalRecords : selectedIds.size;

  return {
    selectedIds,
    selectedCount: effectiveCount,
    pageSelectedCount: selectedIds.size,
    isAllHistorySelected,
    selectRecord,
    selectAll,
    selectAllHistory,
    clearSelection,
    getSelectedRecords,
  };
}
