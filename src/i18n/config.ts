
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';

// Função para detectar o idioma preferido do usuário
const detectUserLanguage = () => {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && ['en', 'pt-BR'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Verifica o idioma do navegador
  const browserLang = navigator.language;
  if (browserLang && browserLang.startsWith('pt')) {
    return 'pt-BR';
  }
  
  return 'pt-BR'; // Idioma padrão
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

// Verificar se uma chave existe nas traduções
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};

// Função para verificar se há chaves faltantes (útil para desenvolvimento)
export const findMissingKeys = (): string[] => {
  if (process.env.NODE_ENV !== 'development') return [];
  
  const missingKeys: string[] = [];
  const allKeys = Object.keys(translations.en);
  
  for (const key of allKeys) {
    if (!i18n.exists(key)) {
      missingKeys.push(key);
    }
  }
  
  return missingKeys;
};

export default i18n;
