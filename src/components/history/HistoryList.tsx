
import React, { useMemo } from 'react';
import { ProcessingRecord } from '@/hooks/useZplConversion';
import { HistoryListItem } from './HistoryListItem';
import { useDateFormatter } from '@/hooks/history/useDateFormatter';

interface GroupedRecords {
  [dateKey: string]: {
    label: string;
    sortKey: string;
    records: ProcessingRecord[];
  };
}

interface HistoryListProps {
  records: ProcessingRecord[];
  onDownload: (record: ProcessingRecord) => void;
  onDelete: (record: ProcessingRecord) => void;
}

export function HistoryList({ records, onDownload, onDelete }: HistoryListProps) {
  const { formatTimeOnly, getRelativeDate, getDateKey } = useDateFormatter();

  const groupedRecords = useMemo(() => {
    const groups: GroupedRecords = {};
    
    records.forEach((record) => {
      const dateKey = getDateKey(record.date);
      const label = getRelativeDate(record.date);
      
      if (!groups[dateKey]) {
        groups[dateKey] = {
          label,
          sortKey: dateKey,
          records: [],
        };
      }
      groups[dateKey].records.push(record);
    });

    // Sort records within each group by time (newest first)
    Object.values(groups).forEach((group) => {
      group.records.sort((a, b) => b.date.getTime() - a.date.getTime());
    });

    return groups;
  }, [records, getDateKey, getRelativeDate]);

  // Sort groups by date (newest first)
  const sortedGroupKeys = useMemo(() => {
    return Object.keys(groupedRecords).sort((a, b) => b.localeCompare(a));
  }, [groupedRecords]);

  return (
    <div className="space-y-4 max-h-[400px] overflow-y-auto px-2 py-2">
      {sortedGroupKeys.map((dateKey) => {
        const group = groupedRecords[dateKey];
        return (
          <div key={dateKey}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-3 mb-1">
              {group.label}
            </h4>
            <div className="space-y-0.5">
              {group.records.map((record) => (
                <HistoryListItem
                  key={record.id}
                  record={record}
                  formatTime={formatTimeOnly(record.date)}
                  onDownload={onDownload}
                  onDelete={onDelete}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
