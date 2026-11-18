export const LANGUAGES = ['ar', 'fr', 'es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/** Each language's name in its own script (BUILD_GUIDE §6: languages, not flags). */
export const NATIVE_NAMES: Record<Language, string> = {
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
  en: 'English',
};

export function isLanguage(value: unknown): value is Language {
  return typeof value === 'string' && (LANGUAGES as readonly string[]).includes(value);
}

export function isRTL(language: Language): boolean {
  return language === 'ar';
}

/**
 * Picks the first supported language from the device's preferred language codes
 * (e.g. ["fr", "en"] from expo-localization), falling back to English.
 */
export function pickDeviceLanguage(languageCodes: readonly (string | null | undefined)[]): Language {
  for (const code of languageCodes) {
    const base = code?.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(base)) return base;
  }
  return DEFAULT_LANGUAGE;
}
