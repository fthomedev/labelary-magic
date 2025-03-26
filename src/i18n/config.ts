
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import enTranslations from './locales/en';
import ptBRTranslations from './locales/pt-BR';

// Initialize i18n with the saved language preference or default to pt-BR
const savedLanguage = localStorage.getItem('i18nextLng') || 'pt-BR';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: enTranslations },
    'pt-BR': { translation: ptBRTranslations },
  },
  lng: savedLanguage,
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

// Store language preference and update HTML lang attribute
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
});

export default i18n;
