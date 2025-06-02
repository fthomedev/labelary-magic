
import enTranslations from './en';
import ptBRTranslations from './pt-BR';

// Export type for translation keys
export type TranslationKey = keyof typeof enTranslations;

// Create a type for translations that ensures consistency
export type Translations = {
  [K in TranslationKey]: string;
};

// Export the translations object with proper typing
export const translations: Record<string, Translations> = {
  en: enTranslations,
  'pt-BR': ptBRTranslations,
};
