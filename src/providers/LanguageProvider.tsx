import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Alert, I18nManager } from 'react-native';

import { DEFAULT_LANGUAGE, isRTL, type Language } from '../i18n/languages';
import { translate, type TranslationKey, type TranslationParams } from '../i18n/translate';
import { saveLanguage } from '../services/preferences';
import { reloadApp } from '../services/reload';

export interface SetLanguageOptions {
  /** Runs after the user confirms and before the app restarts (e.g. finish onboarding). */
  beforeRestart?: () => Promise<void>;
}

export interface LanguageContextValue {
  language: Language;
  /** True when the current layout is right-to-left. */
  isRTL: boolean;
  t: (key: TranslationKey, params?: TranslationParams) => string;
  /**
   * Changes the language and saves it. If the reading direction changes, asks the user to
   * confirm and restarts the app (BUILD_GUIDE §8). Resolves to false when the user cancels.
   */
  setLanguage: (next: Language, options?: SetLanguageOptions) => Promise<boolean>;
}

const defaultValue: LanguageContextValue = {
  language: DEFAULT_LANGUAGE,
  isRTL: false,
  t: (key, params) => translate(DEFAULT_LANGUAGE, key, params),
  setLanguage: async () => false,
};

const LanguageContext = createContext<LanguageContextValue>(defaultValue);

export function needsDirectionChange(next: Language, layoutIsRTL: boolean): boolean {
  return isRTL(next) !== layoutIsRTL;
}

/** Sets the native layout direction for `language`. Takes effect after a reload. */
export function applyLayoutDirection(language: Language): void {
  I18nManager.allowRTL(true);
  I18nManager.forceRTL(isRTL(language));
}

function confirmRestart(t: LanguageContextValue['t']): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(
      t('languageSwitch.title'),
      t('languageSwitch.message'),
      [
        { text: t('common.cancel'), style: 'cancel', onPress: () => resolve(false) },
        { text: t('languageSwitch.confirm'), onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

interface LanguageProviderProps {
  initialLanguage: Language;
  children: ReactNode;
}

export function LanguageProvider({ initialLanguage, children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);
  const layoutIsRTL = I18nManager.isRTL;

  const t = useCallback<LanguageContextValue['t']>(
    (key, params) => translate(language, key, params),
    [language],
  );

  const setLanguage = useCallback<LanguageContextValue['setLanguage']>(
    async (next, options) => {
      if (needsDirectionChange(next, I18nManager.isRTL)) {
        const confirmed = await confirmRestart(t);
        if (!confirmed) return false;
        await saveLanguage(next);
        await options?.beforeRestart?.();
        applyLayoutDirection(next);
        await reloadApp();
        return true;
      }
      await saveLanguage(next);
      setLanguageState(next);
      return true;
    },
    [t],
  );

  const value = useMemo(
    () => ({ language, isRTL: layoutIsRTL, t, setLanguage }),
    [language, layoutIsRTL, t, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
