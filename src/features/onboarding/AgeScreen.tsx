import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGuide } from '../../components/AnimatedGuide';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { ageBandFromBirthYear, birthYearsAscending, INITIAL_WHEEL_OFFSET } from './ageBand';
import { guideMapmaker } from './onboardingArt';
import { YearWheel } from './YearWheel';

/**
 * Neutral age screen (design: Onboarding · Age; Google Families): a plain year wheel,
 * no hint of a right answer. Only the resulting age band is stored.
 */
export function AgeScreen({ navigation }: RootScreenProps<'Age'>) {
  const { t } = useLanguage();
  const { setAgeBand } = useSession();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => birthYearsAscending(currentYear), [currentYear]);
  const [year, setYear] = useState(currentYear - INITIAL_WHEEL_OFFSET);
  const [saving, setSaving] = useState(false);

  const confirm = async () => {
    setSaving(true);
    await setAgeBand(ageBandFromBirthYear(year, currentYear));
    navigation.replace('Language', { onboarding: true });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.row}>
        <AnimatedGuide frames={guideMapmaker.wave} width={210} height={242} />
        <View style={styles.content}>
          <AppText variant="title">{t('age.title')}</AppText>
          <AppText color="textMuted">{t('age.subtitle')}</AppText>
          <View style={styles.pickerRow}>
            <YearWheel years={years} value={year} onChange={setYear} accessibilityLabel={t('age.title')} />
            <Button
              label={t('common.continue')}
              loading={saving}
              onPress={() => void confirm()}
              endIcon={<DirectionalIcon direction="forward" size={18} color={tokens.color.textOnPrimary} />}
            />
          </View>
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
  content: { flexShrink: 1, maxWidth: 440, gap: tokens.spacing.sm },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.lg, marginTop: tokens.spacing.xs },
});
