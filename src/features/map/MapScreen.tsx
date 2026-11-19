import type { RootScreenProps } from '../../navigation/types';
import { AtlasMap } from './AtlasMap';

export function MapScreen({ navigation }: RootScreenProps<'Map'>) {
  return <AtlasMap
    openContinent={continent => navigation.navigate('Continent', { continent })}
    openStory={slug => navigation.navigate('StoryCard', { slug })}
    openPassport={() => navigation.navigate('Passport')}
    openSettings={() => navigation.navigate('Settings')}
  />;
}
