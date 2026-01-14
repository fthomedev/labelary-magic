
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

export function useDateFormatter() {
  const { i18n, t } = useTranslation();
  const isMobile = useIsMobile();
  const isPtBr = i18n.language === 'pt-BR';
  const locale = isPtBr ? 'pt-BR' : 'en-US';
  
  const formatDate = useCallback((date: Date) => {
    try {
      if (isMobile) {
        // More compact date format for mobile view
        return date.toLocaleDateString(locale, { 
          day: '2-digit', 
          month: '2-digit', 
          hour: '2-digit', 
          minute: '2-digit' 
        }).replace(',', '');
      }
      
      // Format without commas
      const dateStr = date.toLocaleDateString(locale).replace(',', '');
      const timeStr = date.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '');
      
      return dateStr + ' ' + timeStr;
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  }, [isMobile, locale]);

  // Returns only time: "19:13"
  const formatTimeOnly = useCallback((date: Date) => {
    try {
      return date.toLocaleTimeString(locale, { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch (e) {
      console.error('Error formatting time:', e);
      return '';
    }
  }, [locale]);

  // Returns human date: "31 Dez" or "Dec 31"
  const formatDateHuman = useCallback((date: Date) => {
    try {
      const day = date.getDate();
      const month = date.toLocaleDateString(locale, { month: 'short' }).replace('.', '');
      const year = date.getFullYear();
      const currentYear = new Date().getFullYear();
      
      if (isPtBr) {
        // Portuguese format: "31 Dez" or "31 Dez 2024"
        return year !== currentYear ? `${day} ${month} ${year}` : `${day} ${month}`;
      } else {
        // English format: "Dec 31" or "Dec 31, 2024"
        return year !== currentYear ? `${month} ${day}, ${year}` : `${month} ${day}`;
      }
    } catch (e) {
      console.error('Error formatting date:', e);
      return '';
    }
  }, [locale, isPtBr]);

  // Returns human date with time: "31 Dez, 19:13"
  const formatDateTimeHuman = useCallback((date: Date) => {
    try {
      const dateHuman = formatDateHuman(date);
      const time = formatTimeOnly(date);
      return `${dateHuman}, ${time}`;
    } catch (e) {
      console.error('Error formatting date time:', e);
      return '';
    }
  }, [formatDateHuman, formatTimeOnly]);

  // Returns "Hoje", "Ontem" or formatted date for grouping
  const getRelativeDate = useCallback((date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return t('today');
    } else if (isYesterday) {
      return t('yesterday');
    } else {
      return formatDateHuman(date);
    }
  }, [t, formatDateHuman]);

  // Get a sortable date key (YYYY-MM-DD format)
  const getDateKey = useCallback((date: Date): string => {
    return date.toISOString().split('T')[0];
  }, []);

  return { 
    formatDate, 
    formatTimeOnly,
    formatDateHuman,
    formatDateTimeHuman,
    getRelativeDate,
    getDateKey,
    isMobile 
  };
}
