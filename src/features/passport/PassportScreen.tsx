import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import { useLanguage } from '../../providers/LanguageProvider';

/** PLACEHOLDER: stamps collection (Phase 6). */
export function PassportScreen() {
  const { t } = useLanguage();
  return <PlaceholderScreen title={t('screens.passport')} />;
}
