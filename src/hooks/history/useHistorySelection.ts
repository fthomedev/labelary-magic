
import { useState, useCallback } from 'react';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistorySelection(records: ProcessingRecord[]) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const selectRecord = useCallback((id: string, selected: boolean) => {
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
    if (selected) {
      setSelectedIds(new Set(records.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  }, [records]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const getSelectedRecords = useCallback(() => {
    return records.filter(r => selectedIds.has(r.id));
  }, [records, selectedIds]);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    selectRecord,
    selectAll,
    clearSelection,
    getSelectedRecords,
  };
}
