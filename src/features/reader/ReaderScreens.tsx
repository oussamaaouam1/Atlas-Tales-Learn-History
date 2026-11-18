import { Button } from '../../components/Button';
import { PlaceholderScreen } from '../../components/PlaceholderScreen';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';

/** PLACEHOLDER: page reader (Phase 4). */
export function ReaderScreen({ navigation, route }: RootScreenProps<'Reader'>) {
  const { t } = useLanguage();
  const { slug } = route.params;
  return (
    <PlaceholderScreen title={t('screens.reader')}>
      <Button label={t('story.nextChapter')} onPress={() => navigation.navigate('ChapterBreak', { slug, chapter: 1 })} />
    </PlaceholderScreen>
  );
}

/** PLACEHOLDER: between chapters (Phase 4). */
export function ChapterBreakScreen({ navigation, route }: RootScreenProps<'ChapterBreak'>) {
  const { t } = useLanguage();
  const { slug } = route.params;
  return (
    <PlaceholderScreen title={t('screens.chapterBreak')}>
      <Button label={t('story.finish')} onPress={() => navigation.navigate('End', { slug })} />
    </PlaceholderScreen>
  );
}

/** PLACEHOLDER: end screen with stamp and quiz (Phases 4 and 6). */
export function EndScreen({ navigation }: RootScreenProps<'End'>) {
  const { t } = useLanguage();
  return (
    <PlaceholderScreen title={t('screens.end')}>
      <Button label={t('story.backToMap')} onPress={() => navigation.popToTop()} />
    </PlaceholderScreen>
  );
}
