export const LANGUAGES = ['ar', 'fr', 'es', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = 'en';

/** Order of the language cards (owner, BACKLOG #26). */
export const PICKER_ORDER: readonly Language[] = ['en', 'es', 'fr', 'ar'];

/** Each language's name in its own script (BUILD_GUIDE §6: languages, not flags). */
export const NATIVE_NAMES: Record<Language, string> = {
  ar: 'العربية',
  fr: 'Français',
  es: 'Español',
  en: 'English',
};

/** A greeting in each language, shown under its name on the language cards (design). */
export const GREETINGS: Record<Language, string> = {
  ar: 'مرحبًا',
  fr: 'Bonjour',
  es: '¡Hola!',
  en: 'Hello',
};

/** The device's language if it is one of the four, else null (design: preselect only a supported one). */
export function supportedDeviceLanguage(languageCodes: readonly (string | null | undefined)[]): Language | null {
  for (const code of languageCodes) {
    const base = code?.toLowerCase().split(/[-_]/)[0];
    if (isLanguage(base)) return base;
  }
  return null;
}

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
  return supportedDeviceLanguage(languageCodes) ?? DEFAULT_LANGUAGE;
}
