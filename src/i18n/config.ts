
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    'pt-BR': { translation: translations['pt-BR'] },
  },
  lng: localStorage.getItem('i18nextLng') || 'pt-BR', // Use saved language or default
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
