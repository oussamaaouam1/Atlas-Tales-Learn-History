import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../../convex/_generated/api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';

export function StoryCardSheet({ navigation, route }: RootScreenProps<'StoryCard'>) {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { slug } = route.params;
  const result = useQuery(api.stories.getStory, { slug });
  const story = result?.story;
  const formatter = new Intl.NumberFormat(language);
  const minutes = Math.max(1, Math.round((story?.durationSec ?? 0) / 60));

  return (
    <View style={[styles.root, { paddingBottom: insets.bottom, paddingHorizontal: 16 + Math.max(insets.left, insets.right) }]}>
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => navigation.goBack()} />
      <View style={styles.sheet} accessibilityViewIsModal>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          {story && <Image source={story.coverImageUrl} accessibilityIgnoresInvertColors style={styles.cover} contentFit="cover" />}
          <View style={styles.details}>
            {result === undefined && <ActivityIndicator accessibilityLabel={t('common.loading')} color={tokens.color.primary} />}
            {result === null && <AppText>{t('map.unavailable')}</AppText>}
            {story && <>
              <AppText bold color="primary" variant="caption">{story.era.period} · {formatter.format(story.era.yearStart)}</AppText>
              <AppText bold variant="title">{story.title[language]}</AppText>
              <AppText color="textMuted" variant="caption">
                {story.location.name} · {t('map.storyMeta', { pages: formatter.format(story.pageCount), minutes: formatter.format(minutes) })}
              </AppText>
              <AppText>{story.hook[language]}</AppText>
              {story.chapters.map(chapter => (
                <View key={chapter.number} style={styles.chapter}>
                  <AppText bold color="primary">{formatter.format(chapter.number)}</AppText>
                  <AppText>{chapter.title[language]}</AppText>
                </View>
              ))}
              <Button label={t('story.start')} onPress={() => navigation.replace('Reader', { slug })} />
            </>}
          </View>
          <Pressable style={styles.close} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => navigation.goBack()}>
            <AppText bold align="center">×</AppText>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(20, 33, 61, 0.35)' },
  sheet: { width: '100%', maxWidth: 720, maxHeight: '84%', backgroundColor: tokens.color.surface, borderTopStartRadius: 26, borderTopEndRadius: 26, ...tokens.shadow.card },
  handle: { width: 38, height: 4, borderRadius: 3, backgroundColor: tokens.color.border, alignSelf: 'center', marginTop: 8 },
  content: { flexDirection: 'row', alignItems: 'flex-start', padding: 14, gap: 12 },
  cover: { width: '25%', aspectRatio: 8 / 5, backgroundColor: tokens.color.background, borderRadius: 14 },
  details: { flex: 1, gap: 4 },
  chapter: { flexDirection: 'row', gap: 10, borderTopColor: tokens.color.border, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 3 },
  close: { minWidth: 44, minHeight: 44, borderRadius: 22, backgroundColor: tokens.color.background, justifyContent: 'center' },
});
