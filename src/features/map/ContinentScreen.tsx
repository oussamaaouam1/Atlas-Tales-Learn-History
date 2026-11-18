import { Button } from '../../components/Button';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';

/** PLACEHOLDER: zoomed continent with pins (Phase 3). */
export function ContinentScreen({ navigation }: RootScreenProps<'Continent'>) {
  const { t } = useLanguage();
  return (
    <PlaceholderScreen title={t('screens.continent')}>
      <Button label={t('map.openStory')} onPress={() => navigation.navigate('StoryCard', { slug: 'fixture-story' })} />
    </PlaceholderScreen>
  );
}
