import ar from './ar.json';
import en from './en.json';
import es from './es.json';
import fr from './fr.json';
import type { Language } from './languages';

type Dictionary = typeof en;

/** Dot paths to every string leaf of the English dictionary, e.g. "common.continue". */
type Paths<T, Prefix extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${Prefix}${K}` : Paths<T[K], `${Prefix}${K}.`>;
}[keyof T & string];

export type TranslationKey = Paths<Dictionary>;
export type TranslationParams = Record<string, string | number>;

export const dictionaries: Record<Language, Dictionary> = { ar, en, es, fr };

function lookup(dictionary: unknown, key: string): string | undefined {
  let node: unknown = dictionary;
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === 'string' ? node : undefined;
}

/** Translates `key` for `language`; falls back to English, then to the key itself. Supports {{name}} params. */
export function translate(language: Language, key: TranslationKey, params?: TranslationParams): string {
  const text = lookup(dictionaries[language], key) ?? lookup(dictionaries.en, key) ?? key;
  if (!params) return text;
  return text.replace(/\{\{(\w+)\}\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match,
  );
}
