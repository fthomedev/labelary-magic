
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';

// Function to detect user's preferred language
const detectUserLanguage = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') return 'pt-BR';
  
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && ['en', 'pt-BR'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Check browser language
  const browserLang = navigator.language;
  if (browserLang && browserLang.startsWith('pt')) {
    return 'pt-BR';
  }
  
  return 'pt-BR'; // Default language
};

// Initialize i18n with the saved language preference or default to pt-BR
const savedLanguage = typeof window !== 'undefined' ? detectUserLanguage() : 'pt-BR';

i18n.use(initReactI18next).init({
  resources: translations,
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
  if (typeof window !== 'undefined') {
    localStorage.setItem('i18nextLng', lng);
    document.documentElement.lang = lng;
    
    // Trigger a custom event that components can listen for
    document.dispatchEvent(new CustomEvent('i18n-language-changed', { detail: lng }));
  }
});

// Helper functions for translation management
export const getCurrentLanguage = () => i18n.language;
export const getTranslation = (key: string, options?: Record<string, any>) => i18n.t(key, options);
export const hasTranslation = (key: string): boolean => i18n.exists(key);

// Function to find missing translation keys
export const findMissingKeys = (): { enMissing: string[], ptBRMissing: string[] } => {
  const enKeys = new Set(Object.keys(translations.en.translation));
  const ptBRKeys = new Set(Object.keys(translations['pt-BR'].translation));
  
  const enMissing = [...ptBRKeys].filter(key => !enKeys.has(key));
  const ptBRMissing = [...enKeys].filter(key => !ptBRKeys.has(key));
  
  return { enMissing, ptBRMissing };
};

// Function to validate translation consistency between languages
export const validateTranslations = (): { missingInEn: string[], missingInPtBR: string[] } => {
  const enKeys = new Set(Object.keys(translations.en.translation));
  const ptBRKeys = new Set(Object.keys(translations['pt-BR'].translation));
  
  const missingInEn = [...ptBRKeys].filter(key => !enKeys.has(key));
  const missingInPtBR = [...enKeys].filter(key => !ptBRKeys.has(key));
  
  return { missingInEn, missingInPtBR };
};

export default i18n;
