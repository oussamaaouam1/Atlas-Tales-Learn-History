import { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { ageBandFromBirthYear, selectableBirthYears, type AgeBand } from './ageBand';

/**
 * Neutral age screen (§6, Google Families): a plain year list, no default selection,
 * no hint about a "right" answer. Only the resulting age band is stored.
 */
export function AgeScreen({ navigation }: RootScreenProps<'Age'>) {
  const { t } = useLanguage();
  const { setAgeBand } = useSession();
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => selectableBirthYears(currentYear), [currentYear]);

  const choose = async (band: AgeBand) => {
    await setAgeBand(band);
    navigation.replace('Language', { onboarding: true });
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        <AppText variant="title" bold align="center">
          {t('age.title')}
        </AppText>
        <AppText color="textMuted" align="center">
          {t('age.subtitle')}
        </AppText>
      </View>
      <FlatList
        data={years}
        keyExtractor={(year) => String(year)}
        numColumns={6}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => void choose(ageBandFromBirthYear(item, currentYear))}
            style={({ pressed }) => [styles.year, pressed && styles.yearPressed]}
          >
            {/* Years stay in Western digits (§8). */}
            <AppText variant="bodyLarge" align="center">
              {String(item)}
            </AppText>
          </Pressable>
        )}
      />
      <View style={styles.footer}>
        <Button variant="ghost" label={t('age.skip')} onPress={() => void choose('unknown')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  header: { paddingHorizontal: tokens.spacing.lg, paddingTop: tokens.spacing.md, gap: tokens.spacing.xs },
  list: { paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.md, gap: tokens.spacing.sm },
  row: { gap: tokens.spacing.sm },
  year: {
    flex: 1,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surface,
    borderWidth: 1,
    borderColor: tokens.color.border,
  },
  yearPressed: { backgroundColor: tokens.color.surfaceMuted },
  footer: { paddingHorizontal: tokens.spacing.lg, paddingBottom: tokens.spacing.xs, alignItems: 'center' },
});
