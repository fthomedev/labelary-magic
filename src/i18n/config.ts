
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';
import LanguageDetector from 'i18next-browser-languagedetector';

// Configuração global otimizada para carregamento
let isInitialized = false;

// Função para detectar o idioma preferido do usuário
const detectUserLanguage = () => {
  const savedLanguage = localStorage.getItem('i18nextLng');
  if (savedLanguage && ['en', 'pt-BR'].includes(savedLanguage)) {
    return savedLanguage;
  }
  
  // Verificar idioma do navegador
  const browserLang = navigator.language;
  if (browserLang && browserLang.startsWith('pt')) {
    return 'pt-BR';
  }
  
  return 'pt-BR'; // Idioma padrão
};

// Configuração centralizada e otimizada para performance
const initI18n = async () => {
  if (isInitialized) {
    return i18n;
  }

  const savedLanguage = detectUserLanguage();

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: translations.en },
        'pt-BR': { translation: translations['pt-BR'] },
      },
      lng: savedLanguage,
      fallbackLng: 'pt-BR',
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
        bindI18n: 'languageChanged',
        bindI18nStore: 'added removed',
        transEmptyNodeValue: '',
        transSupportBasicHtmlNodes: true,
        transKeepBasicHtmlNodesFor: ['br', 'strong', 'i'],
      },
      detection: {
        order: ['localStorage', 'navigator'],
        lookupLocalStorage: 'i18nextLng',
        caches: ['localStorage'],
      },
      debug: process.env.NODE_ENV === 'development',
      
      // Configurações de performance
      load: 'languageOnly',
      cleanCode: true,
      
      // Configurações de carregamento global
      preload: ['pt-BR', 'en'],
      
      // Configurações de cache otimizadas
      updateMissing: false,
      saveMissing: false,
      
      // Configurações para carregamento assíncrono
      initImmediate: false,
      
      // Configurar keySeparator e nsSeparator para melhor performance
      keySeparator: false,
      nsSeparator: false,
    });

  // Configurar atributo lang do HTML no carregamento inicial
  document.documentElement.lang = i18n.language;
  
  isInitialized = true;
  return i18n;
};

// Event listeners globais para mudanças de idioma
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
  
  // Disparar evento customizado para componentes que precisam reagir
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('i18n-language-changed', { detail: lng }));
  }
});

// Event listener para inicialização completa
i18n.on('initialized', (options) => {
  console.log('i18n initialized with language:', options.lng);
});

// Função para inicialização global (chamada no main.tsx)
export const initializeI18n = () => {
  return initI18n();
};

// Função para obter o idioma atual
export const getCurrentLanguage = () => i18n.language;

// Função para obter uma tradução específica de forma segura
export const getTranslation = (key: string, options?: Record<string, any>) => {
  try {
    return i18n.t(key, options);
  } catch (error) {
    console.warn(`Translation key not found: ${key}`);
    return key;
  }
};

// Verificar se uma chave de tradução existe
export const hasTranslation = (key: string): boolean => {
  return i18n.exists(key);
};

// Função para encontrar chaves de tradução ausentes (útil para desenvolvimento)
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

// Função para validar a consistência das traduções entre idiomas
export const validateTranslations = (): { missingInEn: string[], missingInPtBR: string[] } => {
  const enKeys = new Set(Object.keys(translations.en));
  const ptBRKeys = new Set(Object.keys(translations['pt-BR']));
  
  const missingInEn = [...ptBRKeys].filter(key => !enKeys.has(key));
  const missingInPtBR = [...enKeys].filter(key => !ptBRKeys.has(key));
  
  return { missingInEn, missingInPtBR };
};

// Função para log de chaves ausentes em desenvolvimento
export const logMissingTranslations = () => {
  if (process.env.NODE_ENV === 'development') {
    const validation = validateTranslations();
    if (validation.missingInEn.length > 0) {
      console.warn('Missing keys in English:', validation.missingInEn);
    }
    if (validation.missingInPtBR.length > 0) {
      console.warn('Missing keys in Portuguese:', validation.missingInPtBR);
    }
    
    const missingKeys = findMissingKeys();
    if (missingKeys.length > 0) {
      console.warn('Missing translation keys:', missingKeys);
    }
  }
};

// Função para mudança de idioma com callback
export const changeLanguage = async (lng: string, callback?: () => void) => {
  try {
    await i18n.changeLanguage(lng);
    if (callback) callback();
  } catch (error) {
    console.error('Error changing language:', error);
  }
};

export default i18n;
