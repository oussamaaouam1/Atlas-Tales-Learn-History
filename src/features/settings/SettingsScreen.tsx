import { AppText } from '../../components/AppText';
import { Card } from '../../components/Card';
import { Screen } from '../../components/Screen';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { LanguagePicker } from './LanguagePicker';

/** Settings / parent portal. Phase 1: language switch only. Parent gate arrives in Phase 7. */
export function SettingsScreen() {
  const { t, language, setLanguage } = useLanguage();
  const { ownerKey, status } = useSession();

  return (
    <Screen scroll narrow edges={['bottom', 'left', 'right']}>
      <AppText variant="title" bold>
        {t('settings.language')}
      </AppText>
      <LanguagePicker selected={language} onSelect={(next) => void setLanguage(next)} />
      <Card>
        <AppText variant="caption" color="textMuted">
          {t('settings.installId')}
        </AppText>
        {/* Technical ID: always shown left-to-right. */}
        <AppText variant="caption" selectable style={{ writingDirection: 'ltr' }}>
          {ownerKey ?? '…'} · {status}
        </AppText>
      </Card>
    </Screen>
  );
}
