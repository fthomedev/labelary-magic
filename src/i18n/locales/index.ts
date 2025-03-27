
import enTranslations from './en';
import ptBRTranslations from './pt-BR';

// Ensure all translation files have the same type
type TranslationType = typeof enTranslations;

export const translations: Record<string, TranslationType> = {
  en: enTranslations,
  'pt-BR': ptBRTranslations,
};

// Export a type for the translation keys
export type TranslationKey = keyof typeof enTranslations;
