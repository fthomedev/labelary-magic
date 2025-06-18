
import { useState } from 'react';
import { ProcessingRecord } from '@/hooks/useZplConversion';

export function useHistoryShare() {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [recordToShare, setRecordToShare] = useState<ProcessingRecord | null>(null);

  const handleShareClick = (record: ProcessingRecord) => {
    setRecordToShare(record);
    setIsShareModalOpen(true);
  };

  const closeShareModal = () => {
    setIsShareModalOpen(false);
    setRecordToShare(null);
  };

  return {
    isShareModalOpen,
    recordToShare,
    handleShareClick,
    closeShareModal,
  };
}
