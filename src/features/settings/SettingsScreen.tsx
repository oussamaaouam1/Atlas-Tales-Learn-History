import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AnimatedGuide } from '../../components/AnimatedGuide';
import { AppText } from '../../components/AppText';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { guideNavigator } from '../onboarding/onboardingArt';
import { LanguagePicker } from './LanguagePicker';

/**
 * Settings / parent portal. Phase 1: language switch, with the language guide pointing at the
 * cards (owner, BACKLOG #23). Parent gate arrives in Phase 7.
 */
export function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { ownerKey, status } = useSession();
  const { height: screenHeight } = useWindowDimensions();
  // Sits under the navigation header, so a little smaller than on the onboarding screen.
  const guideHeight = Math.min(screenHeight * 0.68, 380);
  const guideWidth = (guideHeight * 1024) / 1180;

  return (
    <SafeAreaView style={styles.root} edges={['bottom', 'left', 'right']}>
      <View style={styles.row}>
        <AnimatedGuide frames={guideNavigator.point} width={guideWidth} height={guideHeight} />
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <AppText variant="title" bold>
            {t('settings.language')}
          </AppText>
          <LanguagePicker selected={language} onSelect={(next) => void setLanguage(next)} />
          {/* Technical install ID on one small line (always left-to-right). */}
          <AppText variant="caption" color="textMuted" selectable numberOfLines={1} style={{ writingDirection: 'ltr' }}>
            {t('settings.installId')}: {ownerKey ?? '…'} · {status}
          </AppText>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  row: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.md, paddingHorizontal: tokens.spacing.lg },
  scroll: { flex: 1, alignSelf: 'stretch' },
  content: { gap: tokens.spacing.sm, paddingVertical: tokens.spacing.sm, maxWidth: 560, width: '100%', alignSelf: 'center', flexGrow: 1, justifyContent: 'center' },
});
