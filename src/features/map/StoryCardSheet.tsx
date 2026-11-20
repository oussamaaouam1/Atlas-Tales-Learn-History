import { useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../../convex/_generated/api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { Icon } from '../../components/icons';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { chapterMinutes, sortedChapters } from '../reader/readerLogic';

/**
 * Story card (design 6, owner BACKLOG #36): a floating card with four rounded corners that fits the
 * screen without scrolling. Cover + hook on one side; era, title, chapters and the main action on the other.
 */
export function StoryCardSheet({ navigation, route }: RootScreenProps<'StoryCard'>) {
  const { language, t } = useLanguage();
  const { installToken } = useSession();
  const insets = useSafeAreaInsets();
  const { slug } = route.params;
  const result = useQuery(api.stories.getStory, { slug });
  const progress = useQuery(api.progress.get, installToken ? { installToken, slug } : 'skip');
  const story = result?.story;
  const formatter = new Intl.NumberFormat(language);
  const durations = (result?.pages ?? []).slice().sort((a, b) => a.page - b.page).map((p) => p.audio[language].durationSec);
  const minutes = Math.max(1, Math.round(durations.reduce((s, d) => s + d, 0) / 60));
  const chapters = sortedChapters(story?.chapters ?? []);
  const resumeChapter = progress && !progress.completed && progress.currentPage > 1 ? progress.currentChapter : null;

  return (
    <View
      style={[
        styles.root,
        { paddingBottom: Math.max(insets.bottom, 12), paddingHorizontal: 16 + Math.max(insets.left, insets.right) },
      ]}
    >
      <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => navigation.goBack()} />
      <Animated.View entering={FadeInDown.duration(320)} style={styles.card} accessibilityViewIsModal>
        {result === undefined && <ActivityIndicator style={styles.loading} accessibilityLabel={t('common.loading')} color={tokens.color.primary} />}
        {result === null && <AppText style={styles.loading}>{t('map.unavailable')}</AppText>}
        {story && (
          <>
            <View style={styles.side}>
              <Image source={story.coverImageUrl} accessibilityIgnoresInvertColors style={styles.cover} contentFit="cover" />
              <AppText variant="caption" color="textMuted" numberOfLines={3}>
                {story.hook[language]}
              </AppText>
            </View>
            <View style={styles.details}>
              <View style={styles.headRow}>
                <View style={styles.eraPill}>
                  <AppText variant="caption" bold color="primary">
                    {story.era.period} · {formatter.format(story.era.yearStart)}
                  </AppText>
                </View>
                <Pressable style={styles.close} accessibilityRole="button" accessibilityLabel={t('common.close')} onPress={() => navigation.goBack()} hitSlop={8}>
                  <Icon name="close" size={18} color={tokens.color.text} />
                </Pressable>
              </View>
              <AppText variant="title" numberOfLines={1}>
                {story.title[language]}
              </AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {story.location.name} · {t('map.storyMeta', { pages: formatter.format(story.pageCount), minutes: formatter.format(minutes) })}
              </AppText>
              <View style={styles.chapters}>
                {chapters.map((c) => {
                  const done = resumeChapter !== null && c.number < resumeChapter;
                  return (
                    <View key={c.number} style={styles.chapter}>
                      <View style={[styles.badge, done && styles.badgeDone]}>
                        {done ? (
                          <Icon name="check" size={14} color="#FFFFFF" />
                        ) : (
                          <AppText variant="caption" bold color="primary">
                            {formatter.format(c.number)}
                          </AppText>
                        )}
                      </View>
                      <AppText bold numberOfLines={1} style={styles.flex}>
                        {story.chapters.find((x) => x.number === c.number)?.title[language]}
                      </AppText>
                      <AppText variant="caption" color="textMuted">
                        {t('reader.minutes', { n: formatter.format(chapterMinutes(chapters, durations, c.number)) })}
                      </AppText>
                    </View>
                  );
                })}
              </View>
              <Button
                label={resumeChapter ? t('story.continueChapter', { n: formatter.format(resumeChapter) }) : t('story.start')}
                onPress={() => navigation.replace('Reader', { slug })}
              />
            </View>
          </>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', alignItems: 'center', backgroundColor: 'rgba(20, 33, 61, 0.35)' },
  card: {
    width: '100%',
    maxWidth: 760,
    flexDirection: 'row',
    gap: tokens.spacing.md,
    padding: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.card,
  },
  loading: { flex: 1, paddingVertical: tokens.spacing.xl, textAlign: 'center' },
  side: { width: '32%', gap: tokens.spacing.sm },
  cover: { width: '100%', aspectRatio: 8 / 5, borderRadius: tokens.radius.md, backgroundColor: tokens.color.background },
  details: { flex: 1, gap: 4 },
  headRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eraPill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: tokens.radius.pill, backgroundColor: '#E8F0FF' },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.surfaceMuted },
  chapters: { gap: 2, marginVertical: 4 },
  chapter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingVertical: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: tokens.color.border,
  },
  badge: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E1EAFB' },
  badgeDone: { backgroundColor: tokens.color.success },
  flex: { flex: 1 },
});
