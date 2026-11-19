import { GREETINGS, LANGUAGES, PICKER_ORDER, isRTL, pickDeviceLanguage, supportedDeviceLanguage } from './languages';
import { dictionaries, translate, type TranslationKey } from './translate';

function leafPaths(node: unknown, prefix = ''): string[] {
  if (typeof node === 'string') return [prefix];
  if (node === null || typeof node !== 'object') return [];
  return Object.entries(node as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key),
  );
}

describe('translation files', () => {
  const englishKeys = leafPaths(dictionaries.en).sort();

  test.each(LANGUAGES)('%s has exactly the same keys as en', (language) => {
    expect(leafPaths(dictionaries[language]).sort()).toEqual(englishKeys);
  });

  test.each(LANGUAGES)('%s has no empty strings', (language) => {
    for (const key of leafPaths(dictionaries[language])) {
      expect(translate(language, key as TranslationKey).trim()).not.toBe('');
    }
  });

  test('Arabic strings are really Arabic (not copied English)', () => {
    expect(translate('ar', 'common.continue')).toMatch(/[؀-ۿ]/);
  });
});

describe('translate', () => {
  test('returns the string for the language', () => {
    expect(translate('fr', 'common.continue')).toBe('Continuer');
    expect(translate('es', 'common.continue')).toBe('Continuar');
  });

  test('falls back to the key for an unknown key', () => {
    expect(translate('en', 'nope.missing' as TranslationKey)).toBe('nope.missing');
  });
});

describe('languages', () => {
  test('only Arabic is right-to-left', () => {
    expect(LANGUAGES.filter(isRTL)).toEqual(['ar']);
  });

  test('picks the first supported device language', () => {
    expect(pickDeviceLanguage(['de', 'fr-FR', 'en'])).toBe('fr');
    expect(pickDeviceLanguage(['ar-MA'])).toBe('ar');
    expect(pickDeviceLanguage(['ES'])).toBe('es');
  });

  test('falls back to English', () => {
    expect(pickDeviceLanguage(['de', null, undefined])).toBe('en');
    expect(pickDeviceLanguage([])).toBe('en');
  });
});

describe('language screen helpers', () => {
  test('preselects the device language only when it is one of the four', () => {
    expect(supportedDeviceLanguage(['fr-MA', 'en'])).toBe('fr');
    expect(supportedDeviceLanguage(['de', 'it'])).toBeNull();
  });

  test('every language has a greeting', () => {
    for (const language of LANGUAGES) expect(GREETINGS[language].length).toBeGreaterThan(0);
  });
});

test('language cards show English, Spanish, French, Arabic, each once', () => {
  expect(PICKER_ORDER).toEqual(['en', 'es', 'fr', 'ar']);
  expect([...PICKER_ORDER].sort()).toEqual([...LANGUAGES].sort());
});
