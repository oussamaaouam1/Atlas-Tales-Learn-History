export type AgeBand = 'child' | 'teen' | 'adult' | 'unknown';

export const CHILD_MAX_AGE = 12; // under 13
export const TEEN_MAX_AGE = 17; // 13–17
export const OLDEST_SELECTABLE_AGE = 100;

/**
 * Maps a year of birth to an age band (owner decision 2026-11-18: child < 13, teen 13–17, adult 18+).
 * Without a birth date we cannot know if the birthday has passed this year, so we assume it has not
 * (age = currentYear − birthYear − 1). This errs on the side of the more protective band.
 */
export function ageBandFromBirthYear(birthYear: number | null, currentYear: number): AgeBand {
  if (birthYear === null || !Number.isInteger(birthYear)) return 'unknown';
  if (birthYear > currentYear || birthYear < currentYear - OLDEST_SELECTABLE_AGE - 1) return 'unknown';
  const age = currentYear - birthYear - 1;
  if (age <= CHILD_MAX_AGE) return 'child';
  if (age <= TEEN_MAX_AGE) return 'teen';
  return 'adult';
}

/** Years offered on the age wheel, oldest first (design: the wheel reads downward in time). */
export function birthYearsAscending(currentYear: number): number[] {
  return Array.from({ length: OLDEST_SELECTABLE_AGE + 1 }, (_, i) => currentYear - OLDEST_SELECTABLE_AGE + i);
}

/**
 * Where the wheel starts, in years before now (design shows 2018 in 2026). Neutral: no answer is
 * suggested as right, and someone who just taps Continue lands in the most protective band (child).
 */
export const INITIAL_WHEEL_OFFSET = 8;
