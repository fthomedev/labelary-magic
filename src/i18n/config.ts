
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';

// Initialize i18n with the saved language preference or default to pt-BR
const savedLanguage = localStorage.getItem('i18nextLng') || 'pt-BR';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: translations.en },
    'pt-BR': { translation: translations['pt-BR'] },
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

// Force language reload when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
});

export default i18n;
