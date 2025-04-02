
import { translations as enTranslations } from './en';
import { translations as ptBRTranslations } from './pt-BR';

// Define a base type using all keys from both languages to ensure completeness
export type TranslationKeys = keyof typeof enTranslations.translation | keyof typeof ptBRTranslations.translation;

// Export the translations object with the correct type
export const translations = {
  en: enTranslations,
  'pt-BR': ptBRTranslations
};

// Export a type for the translation keys
export type TranslationKey = TranslationKeys;

// Helper function to check for missing translations during development
export const checkMissingTranslations = () => {
  if (process.env.NODE_ENV !== 'development') return;
  
  const enKeys = Object.keys(enTranslations.translation);
  const ptBRKeys = Object.keys(ptBRTranslations.translation);
  
  const missingInEn = ptBRKeys.filter(key => !enTranslations.translation.hasOwnProperty(key));
  const missingInPtBR = enKeys.filter(key => !ptBRTranslations.translation.hasOwnProperty(key));
  
  if (missingInEn.length > 0) {
    console.warn('Missing translations in English:', missingInEn);
  }
  
  if (missingInPtBR.length > 0) {
    console.warn('Missing translations in Portuguese:', missingInPtBR);
  }
};
