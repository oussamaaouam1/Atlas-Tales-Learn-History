import { Button } from '../../components/Button';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';

/** PLACEHOLDER: story preview sheet (Phase 3). */
export function StoryCardSheet({ navigation, route }: RootScreenProps<'StoryCard'>) {
  const { t } = useLanguage();
  const { slug } = route.params;
  return (
    <PlaceholderScreen title={t('screens.storyCard')}>
      <Button label={t('story.start')} onPress={() => navigation.navigate('Reader', { slug })} />
      <Button variant="secondary" label={t('story.goPro')} onPress={() => navigation.navigate('Paywall')} />
    </PlaceholderScreen>
  );
}
