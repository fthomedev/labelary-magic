
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
  debug: process.env.NODE_ENV === 'development',
});

// Store language preference and update HTML lang attribute
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
  
  // Trigger a custom event that components can listen for
  document.dispatchEvent(new CustomEvent('i18n-language-changed', { detail: lng }));
});

// Add a function to get the current language
export const getCurrentLanguage = () => i18n.language;

// Add a function to get a specific translation
export const getTranslation = (key: string, options?: Record<string, any>) => {
  return i18n.t(key, options);
};

export default i18n;
