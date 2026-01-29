/**
 * i18n related constants and utilities
 */

export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES = [
  "da",
  "en",
  "fi",
  "fr",
  "it",
  "lt",
  "pl",
  "pt",
  "sv",
  "ta"
] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

export function isValidLocale(locale: string): locale is SupportedLocale {
  return (SUPPORTED_LOCALES as readonly string[]).includes(locale);
}
