import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AgeBand } from '../features/onboarding/ageBand';
import { isLanguage, type Language } from '../i18n/languages';

const KEYS = {
  language: 'atlas.language',
  onboardingComplete: 'atlas.onboardingComplete',
  ageBand: 'atlas.ageBand',
  rtlSyncAttempt: 'atlas.rtlSyncAttempt',
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
