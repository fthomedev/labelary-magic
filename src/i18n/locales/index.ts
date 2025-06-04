
import { en as enTranslations } from './en';
import { ptBR as ptBRTranslations } from './pt-BR';

// Define a base type using Record (dictionary) type
// This allows each language to have its own string values while sharing keys
export type TranslationKeys = keyof typeof enTranslations;

// Create a type for translations that allows different string values per language
export type Translations = {
  [key in TranslationKeys]: string;
};

// Export the translations object with the correct type
export const translations: Record<string, Translations> = {
  en: enTranslations as any, // Type assertion to avoid circular type reference
  'pt-BR': ptBRTranslations as any, // Type assertion to avoid circular type reference
};

// Export a type for the translation keys
export type TranslationKey = keyof typeof enTranslations;
