
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

export function useDateFormatter() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  
  const formatDate = useCallback((date: Date) => {
    try {
      if (isMobile) {
        // More compact date format for mobile view
        return date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(',', '');
      }
      
      // Format without commas
      const dateStr = date.toLocaleDateString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US').replace(',', '');
      const timeStr = date.toLocaleTimeString(i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '');
      
      return dateStr + ' ' + timeStr;
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  }, [isMobile, i18n.language]);

  return { formatDate, isMobile };
}
