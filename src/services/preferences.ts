import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AgeBand } from '../features/onboarding/ageBand';
import { isLanguage, type Language } from '../i18n/languages';

const KEYS = {
  language: 'atlas.language',
  onboardingComplete: 'atlas.onboardingComplete',
  ageBand: 'atlas.ageBand',
  rtlSyncAttempt: 'atlas.rtlSyncAttempt',
  splashIcon: 'atlas.splashIcon',
} as const;

const AGE_BANDS: readonly AgeBand[] = ['child', 'teen', 'adult', 'unknown'];

export interface StoredPreferences {
  language: Language | null;
  onboardingComplete: boolean;
  ageBand: AgeBand | null;
}

export async function loadPreferences(): Promise<StoredPreferences> {
  const entries = await AsyncStorage.multiGet([KEYS.language, KEYS.onboardingComplete, KEYS.ageBand]);
  const map = new Map(entries);
  const language = map.get(KEYS.language);
  const ageBand = map.get(KEYS.ageBand);
  return {
    language: isLanguage(language) ? language : null,
    onboardingComplete: map.get(KEYS.onboardingComplete) === 'true',
    ageBand: AGE_BANDS.find((band) => band === ageBand) ?? null,
  };
}

export const saveLanguage = (language: Language) => AsyncStorage.setItem(KEYS.language, language);
export const saveOnboardingComplete = () => AsyncStorage.setItem(KEYS.onboardingComplete, 'true');
export const saveAgeBand = (ageBand: AgeBand) => AsyncStorage.setItem(KEYS.ageBand, ageBand);

/** Guards against reload loops: remembers which direction we last tried to force at startup. */
export const loadRtlSyncAttempt = () => AsyncStorage.getItem(KEYS.rtlSyncAttempt);
export const saveRtlSyncAttempt = (value: string) => AsyncStorage.setItem(KEYS.rtlSyncAttempt, value);

/** Next index in a rotation of count items (0 when nothing valid is stored). */
export function nextRotation(stored: string | null, count: number): number {
  const previous = Number.parseInt(stored ?? '', 10);
  return Number.isInteger(previous) && previous >= 0 ? (previous + 1) % count : 0;
}

/** Picks this launch's splash icon and remembers it, so each launch shows the next one. */
export async function takeSplashIconIndex(count: number): Promise<number> {
  const index = nextRotation(await AsyncStorage.getItem(KEYS.splashIcon), count);
  await AsyncStorage.setItem(KEYS.splashIcon, String(index));
  return index;
}
