import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './locales';
import LanguageDetector from 'i18next-browser-languagedetector';

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

// Configuração otimizada para carregamento global
const initI18n = async () => {
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
      debug: false, // Desabilitar debug em produção
    });

  // Configurar atributo lang do HTML no carregamento inicial
  document.documentElement.lang = i18n.language;
  
  return i18n;
};

// Armazenar preferência de idioma e atualizar atributo lang do HTML
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('i18nextLng', lng);
  document.documentElement.lang = lng;
  
  // Disparar um evento personalizado que os componentes podem escutar
  document.dispatchEvent(new CustomEvent('i18n-language-changed', { detail: lng }));
});

// Função para inicialização global (chamada no main.tsx)
export const initializeI18n = () => {
  return initI18n();
};

// Adicionar uma função para obter o idioma atual
export const getCurrentLanguage = () => i18n.language;

// Adicionar uma função para obter uma tradução específica
export const getTranslation = (key: string, options?: Record<string, any>) => {
  return i18n.t(key, options);
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

export default i18n;
