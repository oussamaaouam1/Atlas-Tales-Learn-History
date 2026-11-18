import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';

import type { AgeBand } from './features/onboarding/ageBand';
import { isRTL, pickDeviceLanguage, type Language } from './i18n/languages';
import { applyLayoutDirection } from './providers/LanguageProvider';
import { loadPreferences, loadRtlSyncAttempt, saveRtlSyncAttempt } from './services/preferences';
import { reloadApp } from './services/reload';

export interface BootState {
  language: Language;
  onboardingComplete: boolean;
  ageBand: AgeBand | null;
}

/**
 * Loads saved preferences and makes sure the native layout direction matches the language.
 * Returns null when the app is about to restart to apply the direction.
 */
export async function bootstrap(): Promise<BootState | null> {
  const prefs = await loadPreferences();
  const language = prefs.language ?? pickDeviceLanguage(getLocales().map((l) => l.languageCode));

  if (isRTL(language) !== I18nManager.isRTL) {
    // Try once per target direction; never loop if the platform refuses (e.g. a host app overriding RTL).
    const target = isRTL(language) ? 'rtl' : 'ltr';
    if ((await loadRtlSyncAttempt()) !== target) {
      await saveRtlSyncAttempt(target);
      applyLayoutDirection(language);
      await reloadApp();
      return null;
    }
    console.warn(`[bootstrap] Layout direction could not be switched to ${target}.`);
  }

  return { language, onboardingComplete: prefs.onboardingComplete, ageBand: prefs.ageBand };
}
