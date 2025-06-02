
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';
import LanguageDetector from 'i18next-browser-languagedetector';

// Configuração global otimizada para carregamento
let isInitialized = false;

// Configuração centralizada e otimizada para performance
const initI18n = async () => {
  if (isInitialized) {
    return i18n;
  }

  await i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: translations.en },
        'pt-BR': { translation: translations['pt-BR'] },
      },
      fallbackLng: 'en',
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
