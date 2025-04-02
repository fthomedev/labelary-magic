
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';

// Function to detect user's preferred language
const detectUserLanguage = () => {
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
const savedLanguage = detectUserLanguage();

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

// Check if a translation key exists
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};

// Function to find missing translation keys (useful for development)
export const findMissingKeys = (): string[] => {
  if (process.env.NODE_ENV !== 'development') return [];
  
  const missingKeys: string[] = [];
  const allKeys = new Set([
    ...Object.keys(translations.en),
    ...Object.keys(translations['pt-BR'])
  ]);
  
  for (const key of allKeys) {
    if (!i18n.exists(key)) {
      missingKeys.push(key);
    }
  }
  
  return missingKeys;
};

// Function to validate translation consistency between languages
export const validateTranslations = (): { missingInEn: string[], missingInPtBR: string[] } => {
  const enKeys = new Set(Object.keys(translations.en));
  const ptBRKeys = new Set(Object.keys(translations['pt-BR']));
  
  const missingInEn = [...ptBRKeys].filter(key => !enKeys.has(key));
  const missingInPtBR = [...enKeys].filter(key => !ptBRKeys.has(key));
  
  return { missingInEn, missingInPtBR };
};

export default i18n;
