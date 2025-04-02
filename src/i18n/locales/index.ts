
import { translations as enTranslations } from './en';
import { translations as ptBRTranslations } from './pt-BR';

// Define a base type using Record (dictionary) type
export type TranslationKeys = keyof typeof enTranslations.translation;

// Create a type for translations that allows different string values per language
export type Translations = {
  [key in TranslationKeys]: string;
};

// Export the translations object with the correct type
export const translations = {
  en: enTranslations,
  'pt-BR': ptBRTranslations
};

// Export a type for the translation keys
export type TranslationKey = keyof typeof enTranslations.translation;
