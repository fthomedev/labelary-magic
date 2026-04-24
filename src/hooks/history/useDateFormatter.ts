
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsMobile } from '@/hooks/use-mobile';

export function useDateFormatter() {
  const { i18n } = useTranslation();
  const isMobile = useIsMobile();
  
  const formatDate = useCallback((date: Date) => {
    try {
      // Histórico mantém apenas 30 dias, então o ano é redundante.
      // Formato compacto unificado: DD/MM HH:mm
      const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US';
      return date.toLocaleString(locale, {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).replace(',', '');
    } catch (e) {
      console.error('Error formatting date:', e);
      return String(date);
    }
  }, [i18n.language]);

  return { formatDate, isMobile };
}
