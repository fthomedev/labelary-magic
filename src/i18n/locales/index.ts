
import en from './en';
import ptBR from './pt-BR';

// Define a base type using Record (dictionary) type
// This allows each language to have its own string values while sharing keys
export type TranslationKeys = keyof typeof en;

// Create a type for translations that allows different string values per language
export type Translations = {
  [key in TranslationKeys]: string;
};

// Export the translations object with the correct type
export const translations: Record<string, Translations> = {
  en: en as any, // Type assertion to avoid circular type reference
  'pt-BR': ptBR as any, // Type assertion to avoid circular type reference
};

// Export a type for the translation keys
export type TranslationKey = keyof typeof en;
