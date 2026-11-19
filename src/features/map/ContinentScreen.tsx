import type { RootScreenProps } from '../../navigation/types';
import { AtlasMap } from './AtlasMap';

export function ContinentScreen({ navigation, route }: RootScreenProps<'Continent'>) {
  return <AtlasMap
    continent={route.params.continent}
    openContinent={continent => navigation.setParams({ continent })}
    openStory={slug => navigation.navigate('StoryCard', { slug })}
    openPassport={() => navigation.navigate('Passport')}
    onBack={() => navigation.goBack()}
  />;
}
