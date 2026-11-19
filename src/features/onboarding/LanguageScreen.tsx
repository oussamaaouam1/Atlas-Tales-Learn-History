import { getLocales } from 'expo-localization';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGuide } from '../../components/AnimatedGuide';
import { AppText } from '../../components/AppText';
import { supportedDeviceLanguage, type Language } from '../../i18n/languages';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { saveOnboardingComplete } from '../../services/preferences';
import { tokens } from '../../theme/tokens';
import { LanguagePicker } from '../settings/LanguagePicker';
import { guideTraveller } from './onboardingArt';

const CONFIRM_DELAY_MS = 250; // let the radio fill before moving on

export function LanguageScreen({ navigation }: RootScreenProps<'Language'>) {
  const { t, setLanguage } = useLanguage();
  // Design: preselect the device language only if it is one of the four.
  const [selected, setSelected] = useState<Language | null>(() =>
    supportedDeviceLanguage(getLocales().map((locale) => locale.languageCode)),
  );

  const choose = async (next: Language) => {
    setSelected(next);
    await new Promise((resolve) => setTimeout(resolve, CONFIRM_DELAY_MS));
    // If the direction changes the app restarts; onboarding is saved first so it reopens on the map.
    const applied = await setLanguage(next, { beforeRestart: saveOnboardingComplete });
    if (!applied) return;
    await saveOnboardingComplete();
    navigation.reset({ index: 0, routes: [{ name: 'Map' }] });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.row}>
        <AnimatedGuide frames={guideTraveller.point} width={176} height={203} />
        <View style={styles.content}>
          <AppText variant="title">{t('language.title')}</AppText>
          <LanguagePicker selected={selected} onSelect={(next) => void choose(next)} />
          <AppText variant="caption" color="textMuted">
            {t('language.footnote')}
          </AppText>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: tokens.spacing.xl,
    paddingHorizontal: tokens.spacing.xxl,
  },
  content: { flexShrink: 1, maxWidth: 560, gap: tokens.spacing.medium },
});
