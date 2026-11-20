import { useMutation, useQuery } from 'convex/react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { api } from '../../../convex/_generated/api';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import { Icon } from '../../components/icons';
import { RoundButton } from '../../components/RoundButton';
import type { Language } from '../../i18n/languages';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { tokens } from '../../theme/tokens';
import { ImageSequencer } from './ImageSequencer';
import { NarrationCard } from './NarrationCard';
import {
  afterPage,
  chapterMarks,
  chapterMinutes,
  chapterOf,
  imageIndexAt,
  imagesForPage,
  secondsBefore,
  sortedChapters,
  storyProgress,
  TEXT_SCALES,
  type AfterPage,
  type TextScale,
} from './readerLogic';
import { ChaptersSheet, TextLanguageSheet, type ChapterRow } from './ReaderSheets';

type ChapterBreak = Extract<AfterPage, { type: 'chapterBreak' }>;

/** The story player (BUILD_GUIDE §7.2, design 7D–7I and 8). */
export function ReaderScreen({ navigation, route }: RootScreenProps<'Reader'>) {
  const { slug } = route.params;
  const { language: uiLanguage, t } = useLanguage();
  const { installToken } = useSession();
  const data = useQuery(api.stories.getStory, { slug });
  const saved = useQuery(api.progress.get, installToken ? { installToken, slug } : 'skip');
  const saveProgress = useMutation(api.progress.save);
  const completeStory = useMutation(api.progress.complete);

  const [page, setPage] = useState<number | null>(null);
  const [storyLanguage, setStoryLanguage] = useState<Language>(uiLanguage);
  const [playing, setPlaying] = useState(true);
  const [showText, setShowText] = useState(true);
  const [scale, setScale] = useState<TextScale>('medium');
  const [sheet, setSheet] = useState<'chapters' | 'text' | null>(null);
  const [chapterBreak, setChapterBreak] = useState<ChapterBreak | null>(null);

  // Resume where the reader stopped (§7.2); a finished story starts again from page 1.
  useEffect(() => {
    if (page !== null || !data) return;
    if (installToken && saved === undefined) return;
    setPage(saved && !saved.completed ? saved.currentPage : 1);
  }, [data, saved, installToken, page]);

  const story = data?.story;
  const pages = useMemo(() => [...(data?.pages ?? [])].sort((a, b) => a.page - b.page), [data]);
  const chapters = useMemo(() => sortedChapters(story?.chapters ?? []), [story]);
  const pageCount = story?.pageCount ?? pages.length;
  const current = page !== null ? pages.find((p) => p.page === page) : undefined;
  const pageImages = useMemo(() => (page !== null ? imagesForPage(data?.images ?? [], page) : []), [data, page]);
  const durations = useMemo(() => pages.map((p) => p.audio[storyLanguage].durationSec), [pages, storyLanguage]);

  // Narration: one file per page per language (§7.2).
  const player = useAudioPlayer(null);
  const status = useAudioPlayerStatus(player);
  const audioUrl = current?.audio[storyLanguage].url;
  useEffect(() => {
    void setAudioModeAsync({ playsInSilentMode: true });
  }, []);
  useEffect(() => {
    if (!audioUrl) return;
    player.replace({ uri: audioUrl });
    if (playing && !chapterBreak) player.play();
    // Only when the page or language changes; play/pause has its own effect.
  }, [audioUrl]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (playing && !chapterBreak) player.play();
    else player.pause();
  }, [playing, chapterBreak, player]);

  // Save progress at each page (§7.2).
  useEffect(() => {
    if (page === null || !installToken) return;
    saveProgress({ installToken, slug, page }).catch(() => undefined);
  }, [page, installToken, slug, saveProgress]);

  // Prefetch the next page's art so it is ready (§7.3 streaming).
  useEffect(() => {
    if (page === null || !data) return;
    const next = imagesForPage(data.images, page + 1).map((i) => i.url);
    if (next.length) void Image.prefetch(next);
  }, [page, data]);

  const goNext = useCallback(() => {
    if (page === null || !story) return;
    const action = afterPage(page, pageCount, chapters);
    if (action.type === 'page') setPage(action.page);
    else if (action.type === 'chapterBreak') setChapterBreak(action);
    else {
      if (installToken) completeStory({ installToken, slug }).catch(() => undefined);
      navigation.replace('End', { slug });
    }
  }, [page, story, pageCount, chapters, installToken, completeStory, slug, navigation]);

  const goPrev = () => {
    if (page !== null && page > 1) setPage(page - 1);
  };

  // Autoplay: when a page's narration ends, turn the page (§7.2).
  const finishedFor = useRef<string | null>(null);
  useEffect(() => {
    if (status.didJustFinish && playing && audioUrl && finishedFor.current !== `${page}-${storyLanguage}`) {
      finishedFor.current = `${page}-${storyLanguage}`;
      goNext();
    }
  }, [status.didJustFinish, playing, audioUrl, page, storyLanguage, goNext]);
  useEffect(() => {
    finishedFor.current = null;
  }, [page, storyLanguage]);

  if (data === null) {
    return (
      <View style={styles.center}>
        <AppText align="center">{t('reader.unavailable')}</AppText>
        <Button label={t('story.backToMap')} onPress={() => navigation.popToTop()} />
      </View>
    );
  }
  if (!story || page === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={tokens.color.primary} accessibilityLabel={t('common.loading')} />
      </View>
    );
  }

  const imageIndex = imageIndexAt(pageImages.map((i) => i.durationSec), status.currentTime * 1000);
  const image = pageImages[imageIndex];
  const chapter = chapterOf(chapters, page);
  const elapsed = secondsBefore(durations, page) + status.currentTime;
  const total = durations.reduce((sum, d) => sum + d, 0);
  const pageDuration = durations[page - 1] ?? 1;
  const loading = playing && !chapterBreak && !status.isLoaded;

  const rows: ChapterRow[] = chapters.map((c, i) => {
    const nextFirst = chapters[i + 1]?.firstPage ?? pageCount + 1;
    const state: ChapterRow['state'] = page >= nextFirst ? 'finished' : page >= c.firstPage ? 'current' : 'upcoming';
    return {
      number: c.number,
      title: story.chapters.find((x) => x.number === c.number)?.title[storyLanguage] ?? '',
      minutes: chapterMinutes(chapters, durations, c.number),
      state,
      pageInChapter: page - c.firstPage + 1,
      chapterPages: nextFirst - c.firstPage,
    };
  });

  const arabicText = storyLanguage === 'ar';
  const textScale = TEXT_SCALES[scale];

  return (
    <View style={styles.root}>
      <ImageSequencer url={image?.url} imageKey={`${page}-${image?.order ?? 0}`} dimmed={chapterBreak !== null} />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom', 'left', 'right']}>
        {/* Top: home + page count (start), narration (centre), text, sleep (Pro), chapters (end). */}
        <View style={styles.topRow}>
          <View style={styles.side}>
            <RoundButton accessibilityLabel={t('story.backToMap')} color={tokens.color.accent} onPress={() => navigation.popToTop()}>
              <Icon name="home" color={tokens.color.text} />
            </RoundButton>
            {!chapterBreak && (
              <View style={styles.pagePill} accessible accessibilityLabel={t('reader.pageOf', { page, count: pageCount })}>
                <AppText variant="caption" bold color="primary" style={styles.ltr}>
                  {page}/{pageCount}
                </AppText>
              </View>
            )}
          </View>
          {!chapterBreak && (
            <NarrationCard
              playing={playing}
              loading={loading}
              chapter={chapter}
              chapterCount={chapters.length}
              elapsedSec={elapsed}
              totalSec={total}
              progress={storyProgress(page, pageCount, status.currentTime / pageDuration)}
              marks={chapterMarks(chapters, pageCount)}
              onTogglePlay={() => setPlaying((p) => !p)}
            />
          )}
          <View style={styles.side}>
            {!chapterBreak && (
              <>
                <RoundButton accessibilityLabel={t('reader.textAndLanguage')} color={tokens.color.accent} onPress={() => setSheet('text')}>
                  <Icon name="textSize" color={tokens.color.text} />
                </RoundButton>
                {/* Sleep timer is a Pro feature (§7.6): shown with its badge, opens the Pro screen until Phase 7. */}
                <RoundButton accessibilityLabel={t('reader.sleepTimer')} color={tokens.color.primary} pro onPress={() => navigation.navigate('Paywall')}>
                  <Icon name="moon" color="#FFFFFF" />
                </RoundButton>
                <RoundButton accessibilityLabel={t('reader.chapters')} color={tokens.color.success} onPress={() => setSheet('chapters')}>
                  <Icon name="chapters" color="#FFFFFF" />
                </RoundButton>
              </>
            )}
          </View>
        </View>

        {/* Bottom: previous, the page text card (or "Show text"), next. */}
        {!chapterBreak && (
          <View style={styles.bottomRow}>
            <RoundButton accessibilityLabel={t('reader.previous')} onPress={goPrev} disabled={page <= 1} size={48}>
              <DirectionalIcon direction="back" size={22} color={tokens.color.primary} />
            </RoundButton>
            <View style={styles.textSlot}>
              {showText && current ? (
                <Animated.View key={`${page}-${storyLanguage}`} entering={FadeIn.duration(450)} style={[styles.textCard, loading && styles.textGreyed]}>
                  <Text
                    style={[
                      styles.pageText,
                      {
                        fontFamily: arabicText ? tokens.fontFace.arabic[600] : tokens.fontFace.latin[600],
                        fontSize: 21 * textScale,
                        lineHeight: (arabicText ? 35 : 31) * textScale,
                        writingDirection: arabicText ? 'rtl' : 'ltr',
                      },
                    ]}
                  >
                    {current.text[storyLanguage]}
                  </Text>
                </Animated.View>
              ) : (
                <Pressable accessibilityRole="button" onPress={() => setShowText(true)} style={styles.showText}>
                  <Icon name="text" size={18} color={tokens.color.text} />
                  <AppText variant="caption" bold>
                    {t('reader.showText')}
                  </AppText>
                </Pressable>
              )}
            </View>
            <RoundButton accessibilityLabel={t('reader.next')} onPress={goNext} color={tokens.color.success} size={48}>
              <DirectionalIcon direction="forward" size={22} color="#FFFFFF" />
            </RoundButton>
          </View>
        )}

        {chapterBreak && (
          <ChapterBreakCard
            info={chapterBreak}
            chapterCount={chapters.length}
            cliffhanger={pages.find((p) => p.page === chapterBreak.nextPage - 1)?.text[storyLanguage] ?? ''}
            nextTitle={story.chapters.find((c) => c.number === chapterBreak.nextChapter)?.title[storyLanguage] ?? ''}
            nextMinutes={chapterMinutes(chapters, durations, chapterBreak.nextChapter)}
            storyLanguage={storyLanguage}
            onContinue={() => {
              setChapterBreak(null);
              setPage(chapterBreak.nextPage);
              setPlaying(true);
            }}
            onTomorrow={() => {
              // "Continue tomorrow" saves the place (design 8): the story resumes at the next chapter.
              if (installToken) saveProgress({ installToken, slug, page: chapterBreak.nextPage }).catch(() => undefined);
              navigation.popToTop();
            }}
          />
        )}
      </SafeAreaView>

      <ChaptersSheet
        visible={sheet === 'chapters'}
        rows={rows}
        onClose={() => setSheet(null)}
        onPick={(n) => {
          const first = chapters.find((c) => c.number === n)?.firstPage ?? 1;
          setSheet(null);
          setPage(first);
          setPlaying(true);
        }}
      />
      <TextLanguageSheet
        visible={sheet === 'text'}
        scale={scale}
        showText={showText}
        storyLanguage={storyLanguage}
        onScale={setScale}
        onShowText={setShowText}
        onLanguage={setStoryLanguage}
        onClose={() => setSheet(null)}
      />
    </View>
  );
}

interface ChapterBreakCardProps {
  info: ChapterBreak;
  chapterCount: number;
  cliffhanger: string;
  nextTitle: string;
  nextMinutes: number;
  storyLanguage: Language;
  onContinue: () => void;
  onTomorrow: () => void;
}

/** Design 8: pause on the cliffhanger with a calm choice to keep going or stop for tonight. */
function ChapterBreakCard({ info, chapterCount, cliffhanger, nextTitle, nextMinutes, storyLanguage, onContinue, onTomorrow }: ChapterBreakCardProps) {
  const { t } = useLanguage();
  const arabic = storyLanguage === 'ar';
  return (
    <View style={styles.breakWrap} pointerEvents="box-none">
      <Animated.View entering={FadeInDown.duration(320)} style={styles.breakCard}>
        <View style={styles.segments}>
          {Array.from({ length: chapterCount }, (_, i) => (
            <View key={i} style={[styles.segmentBar, i < info.finishedChapter && styles.segmentDone]} />
          ))}
        </View>
        <View style={styles.endPill}>
          <Icon name="check" size={14} color={tokens.color.success} />
          <AppText variant="caption" bold color="success">
            {t('reader.endOfChapter', { n: info.finishedChapter })}
          </AppText>
        </View>
        <Text
          numberOfLines={4}
          style={[
            styles.cliffhanger,
            { fontFamily: arabic ? tokens.fontFace.arabic[800] : tokens.fontFace.latin[800], writingDirection: arabic ? 'rtl' : 'ltr' },
          ]}
        >
          {cliffhanger}
        </Text>
        <AppText variant="caption" color="textMuted" align="center">
          {t('reader.nextChapter', { n: info.nextChapter, title: nextTitle, min: nextMinutes })}
        </AppText>
        <View style={styles.breakButtons}>
          <Button label={t('reader.continueNow')} onPress={onContinue} />
          <Button label={t('reader.continueTomorrow')} variant="secondary" onPress={onTomorrow} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#14213D' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: tokens.spacing.md, padding: tokens.spacing.xl, backgroundColor: tokens.color.background },
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  side: { width: 64, alignItems: 'center', gap: tokens.spacing.medium },
  pagePill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.surface, ...tokens.shadow.card },
  ltr: { writingDirection: 'ltr' },
  bottomRow: { flexDirection: 'row', alignItems: 'flex-end', gap: tokens.spacing.md },
  textSlot: { flex: 1, alignItems: 'center' },
  textCard: {
    width: '100%',
    maxWidth: 720,
    paddingHorizontal: tokens.spacing.lg,
    paddingVertical: tokens.spacing.medium,
    borderRadius: tokens.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...tokens.shadow.card,
  },
  textGreyed: { opacity: 0.6 },
  pageText: { color: tokens.color.text, textAlign: 'center' },
  showText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: tokens.spacing.md,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.pill,
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.card,
  },
  breakWrap: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center', paddingHorizontal: tokens.spacing.xxl },
  breakCard: {
    width: '100%',
    maxWidth: 600,
    alignItems: 'center',
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.card,
  },
  segments: { flexDirection: 'row', gap: 6 },
  segmentBar: { width: 70, height: 6, borderRadius: 3, backgroundColor: '#DCE7FB' },
  segmentDone: { backgroundColor: tokens.color.success },
  endPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 2, borderRadius: tokens.radius.pill, backgroundColor: '#E2F4EA' },
  cliffhanger: { fontSize: 22, lineHeight: 32, color: tokens.color.text, textAlign: 'center' },
  breakButtons: { flexDirection: 'row', gap: tokens.spacing.md, marginTop: tokens.spacing.xs },
});
