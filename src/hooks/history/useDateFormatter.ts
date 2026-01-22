
import { useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

export function useDateFormatter() {
  const isMobile = useIsMobile();
  
  const formatDate = useCallback((date: Date) => {
    try {
      // Compact date format: DD/MM HH:MM
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${day}/${month} ${hours}:${minutes}`;
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  }, []);

  return { formatDate, isMobile };
}
