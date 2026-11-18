import { Button } from '../../components/Button';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';

/** PLACEHOLDER: Pro offer (Phase 7, behind the parent gate). */
export function PaywallModal({ navigation }: RootScreenProps<'Paywall'>) {
  const { t } = useLanguage();
  return (
    <PlaceholderScreen title={t('screens.paywall')}>
      <Button variant="secondary" label={t('common.close')} onPress={() => navigation.goBack()} />
    </PlaceholderScreen>
  );
}
