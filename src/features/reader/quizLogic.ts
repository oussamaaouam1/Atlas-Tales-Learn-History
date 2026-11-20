import type { TranslationKey } from '../../i18n/translate';

/** Friendly end message: no penalty, just encouragement (§7.4). */
export function quizMessageKey(score: number, total: number): TranslationKey {
  return total > 0 && score === total ? 'end.scoreGreat' : 'end.scoreGood';
}
