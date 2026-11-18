import { AppText } from '../../components/AppText';
import { Screen } from '../../components/Screen';
import type { Language } from '../../i18n/languages';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { saveOnboardingComplete } from '../../services/preferences';
import { LanguagePicker } from '../settings/LanguagePicker';

export function LanguageScreen({ navigation }: RootScreenProps<'Language'>) {
  const { t, language, setLanguage } = useLanguage();

  const choose = async (next: Language) => {
    // If the direction changes the app restarts; onboarding is saved first so it reopens on the map.
    const applied = await setLanguage(next, { beforeRestart: saveOnboardingComplete });
    if (!applied) return;
    await saveOnboardingComplete();
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  return (
    <Screen centered scroll narrow>
      <AppText variant="title" bold align="center">
        {t('language.title')}
      </AppText>
      <AppText color="textMuted" align="center">
        {t('language.subtitle')}
      </AppText>
      <LanguagePicker selected={language} onSelect={(next) => void choose(next)} />
    </Screen>
  );
}
