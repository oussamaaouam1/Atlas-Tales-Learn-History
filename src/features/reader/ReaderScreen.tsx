import { useMutation, useQuery } from 'convex/react';
import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { Image } from 'expo-image';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '../../../convex/_generated/api';
import { AnimatedGuide } from '../../components/AnimatedGuide';
import { AppText } from '../../components/AppText';
import { Button } from '../../components/Button';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import { Icon } from '../../components/icons';
import { RoundButton } from '../../components/RoundButton';
import type { Language } from '../../i18n/languages';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { useSession } from '../../providers/SessionProvider';
import { loadReaderPrefs, saveReaderPrefs } from '../../services/preferences';
import { tokens } from '../../theme/tokens';
import { guideExplorer } from '../onboarding/onboardingArt';
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
  sentenceAt,
  splitSentences,
  splitWords,
  spokenTokenIndex,
  storyProgress,
  swipeAction,
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
  const { height: windowHeight } = useWindowDimensions();
  // Landscape phones have a camera cutout on one side only: mirror the larger inset so cards stay centred (#45).
  const insets = useSafeAreaInsets();
  const sideInset = Math.max(insets.left, insets.right);
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
  const [chrome, setChrome] = useState(true);
  // Guide intro on page 1 (design 7C, owner BACKLOG #42); dismissed by Let's go / Skip intro or leaving page 1.
  const [intro, setIntro] = useState(true);

  // Remember reader settings between stories (owner, BACKLOG #41).
  useEffect(() => {
    void loadReaderPrefs().then((prefs) => {
      if (prefs.textScale) setScale(prefs.textScale);
      if (prefs.showText !== undefined) setShowText(prefs.showText);
      if (prefs.storyLanguage) setStoryLanguage(prefs.storyLanguage);
    });
  }, []);
  const chooseScale = (value: TextScale) => {
    setScale(value);
    void saveReaderPrefs({ textScale: value });
  };
  const chooseShowText = (value: boolean) => {
    setShowText(value);
    void saveReaderPrefs({ showText: value });
  };
  const chooseStoryLanguage = (value: Language) => {
    setStoryLanguage(value);
    void saveReaderPrefs({ storyLanguage: value });
  };

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
  // 200 ms updates keep the word highlight in step with the narration.
  const player = useAudioPlayer(null, { updateInterval: 200 });
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

  // Keep the screen awake while the narration plays (owner, BACKLOG #43).
  useEffect(() => {
    if (!playing || chapterBreak) return;
    void activateKeepAwakeAsync('reader');
    return () => {
      void deactivateKeepAwake('reader');
    };
  }, [playing, chapterBreak]);

  useEffect(() => {
    if (page !== null && page > 1) setIntro(false);
  }, [page]);

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

  // Art gestures: a sideways swipe turns the page in the story's reading direction; a tap shows or hides
  // the controls. Exclusive, so a swipe never also counts as a tap.
  const storyRtl = storyLanguage === 'ar';
  const artGesture = Gesture.Exclusive(
    Gesture.Pan()
      .runOnJS(true)
      .enabled(chapterBreak === null)
      .activeOffsetX([-20, 20])
      .failOffsetY([-25, 25])
      .onEnd((e) => {
        const action = swipeAction(e.translationX, e.velocityX, storyRtl);
        if (action === 'next') goNext();
        else if (action === 'prev') goPrev();
      }),
    Gesture.Tap()
      .runOnJS(true)
      .enabled(chapterBreak === null)
      .onEnd(() => setChrome((visible) => !visible)),
  );

  const showIntro = intro && page === 1 && current?.speaker === 'guide';
  const introGuideHeight = Math.min(windowHeight * 0.78, 420);

  // Follow-along text: the word being read is highlighted, words already read stay dark, the rest are
  // softer (owner, BACKLOG #40; Arabic word-by-word reveal, §7.2). Plain text until narration starts.
  // Line by line (#46): only the sentence being read is shown; it changes as the narration moves on.
  const sentences = current ? splitSentences(current.text[storyLanguage]) : [];
  const narrating = status.isLoaded && status.currentTime > 0;
  const line = narrating ? sentenceAt(sentences, status.currentTime / pageDuration) : { index: 0, local: 0 };
  const sentence = sentences[line.index] ?? '';
  const tokens_ = splitWords(sentence);
  const spoken = narrating ? spokenTokenIndex(tokens_, line.local) : -1;
  const pageText = current ? (
    <Animated.Text
      key={`${page}-${storyLanguage}-${line.index}`}
      entering={FadeIn.duration(300)}
      style={[
        styles.pageText,
        loading && styles.textGreyed,
        {
          fontFamily: arabicText ? tokens.fontFace.arabic[600] : tokens.fontFace.latin[600],
          fontSize: 21 * textScale,
          lineHeight: (arabicText ? 35 : 31) * textScale,
          // Two lines tall so the card does not jump between short and long sentences.
          minHeight: (arabicText ? 35 : 31) * textScale * 2,
          textAlignVertical: 'center',
          writingDirection: arabicText ? 'rtl' : 'ltr',
        },
      ]}
    >
      {narrating
        ? tokens_.map((token, i) => (
            <Text key={i} style={i === spoken ? styles.wordNow : i > spoken ? styles.wordLater : undefined}>
              {token}
            </Text>
          ))
        : sentence}
    </Animated.Text>
  ) : null;

  return (
    <View style={styles.root}>
      <ImageSequencer
        url={image?.url}
        imageKey={`${page}-${image?.order ?? 0}`}
        page={page}
        rtl={storyLanguage === 'ar'}
        dimmed={chapterBreak !== null}
      />

      {/* Tap the picture to hide or show the controls (#37); swipe it sideways to turn the page (#39). */}
      <GestureDetector gesture={artGesture}>
        <View
          style={StyleSheet.absoluteFill}
          accessible
          accessibilityRole="button"
          accessibilityLabel={chrome ? t('reader.hideControls') : t('reader.showControls')}
          accessibilityActions={[{ name: 'activate' }]}
          onAccessibilityAction={() => setChrome((visible) => !visible)}
        />
      </GestureDetector>

      {chrome && !chapterBreak && showIntro && current && (
        <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <SafeAreaView style={[styles.introOverlay, { paddingHorizontal: sideInset + tokens.spacing.medium }]} edges={['top', 'bottom']} pointerEvents="box-none">
            <View style={styles.side} pointerEvents="box-none">
              <RoundButton accessibilityLabel={t('story.backToMap')} color={tokens.color.accent} onPress={() => navigation.popToTop()}>
                <Icon name="home" color={tokens.color.text} />
              </RoundButton>
            </View>
            <View style={styles.introRow} pointerEvents="box-none">
              <Animated.View entering={FadeInDown.springify().damping(12)}>
                <AnimatedGuide frames={guideExplorer.wave} width={introGuideHeight * (1024 / 1180)} height={introGuideHeight} />
              </Animated.View>
              <View style={styles.bubble}>
                <AppText variant="caption" bold color="primary">
                  {t('reader.yourGuide')}
                </AppText>
                <View style={styles.bubbleText}>{pageText}</View>
                <View style={styles.introButtons}>
                  <Button
                    label={t('reader.letsGo')}
                    onPress={() => setIntro(false)}
                    endIcon={<DirectionalIcon direction="forward" size={16} color={tokens.color.textOnPrimary} />}
                  />
                  <Button
                    label={t('reader.skipIntro')}
                    variant="ghost"
                    onPress={() => {
                      setIntro(false);
                      goNext();
                    }}
                  />
                </View>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}

      {chrome && !chapterBreak && !showIntro && (
        <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <SafeAreaView style={[styles.overlay, { paddingHorizontal: sideInset + tokens.spacing.medium }]} edges={['top', 'bottom']} pointerEvents="box-none">
            {/* Top: home + page count (start), narration (centre), text, sleep (Pro), chapters (end). */}
            <View style={styles.topRow} pointerEvents="box-none">
              <View style={styles.side} pointerEvents="box-none">
                <RoundButton accessibilityLabel={t('story.backToMap')} color={tokens.color.accent} onPress={() => navigation.popToTop()}>
                  <Icon name="home" color={tokens.color.text} />
                </RoundButton>
                <View style={styles.pagePill} accessible accessibilityLabel={t('reader.pageOf', { page, count: pageCount })}>
                  <AppText variant="caption" bold color="primary" style={styles.ltr}>
                    {page}/{pageCount}
                  </AppText>
                </View>
              </View>
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
              <View style={styles.side} pointerEvents="box-none">
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
              </View>
            </View>

            {/* Bottom: one wide text card with previous / next inside it (owner, BACKLOG #37). */}
            {showText && current ? (
              <Animated.View key={`${page}-${storyLanguage}`} entering={FadeIn.duration(450)} style={styles.textCard}>
                <RoundButton accessibilityLabel={t('reader.previous')} onPress={goPrev} disabled={page <= 1} size={42}>
                  <DirectionalIcon direction="back" size={20} color={tokens.color.primary} />
                </RoundButton>
                {current.speaker === 'guide' && (
                  // The guide is speaking on this page: show the guide's face (#42).
                  <View style={styles.guideFace} accessibilityLabel={t('reader.yourGuide')}>
                    <Image source={guideExplorer.wave[1]} style={styles.guideFaceImage} contentFit="cover" contentPosition="top" accessibilityIgnoresInvertColors />
                  </View>
                )}
                {pageText}
                <RoundButton accessibilityLabel={t('reader.next')} onPress={goNext} color={tokens.color.success} size={42}>
                  <DirectionalIcon direction="forward" size={20} color="#FFFFFF" />
                </RoundButton>
              </Animated.View>
            ) : (
              <View style={styles.bottomRow} pointerEvents="box-none">
                <RoundButton accessibilityLabel={t('reader.previous')} onPress={goPrev} disabled={page <= 1} size={48}>
                  <DirectionalIcon direction="back" size={22} color={tokens.color.primary} />
                </RoundButton>
                <Pressable accessibilityRole="button" onPress={() => chooseShowText(true)} style={styles.showText}>
                  <Icon name="text" size={18} color={tokens.color.text} />
                  <AppText variant="caption" bold>
                    {t('reader.showText')}
                  </AppText>
                </Pressable>
                <RoundButton accessibilityLabel={t('reader.next')} onPress={goNext} color={tokens.color.success} size={48}>
                  <DirectionalIcon direction="forward" size={22} color="#FFFFFF" />
                </RoundButton>
              </View>
            )}
          </SafeAreaView>
        </Animated.View>
      )}

      {chapterBreak && (
        <SafeAreaView style={[styles.overlay, { paddingHorizontal: sideInset + tokens.spacing.medium }]} edges={['top', 'bottom']} pointerEvents="box-none">
          <View style={styles.side} pointerEvents="box-none">
            <RoundButton accessibilityLabel={t('story.backToMap')} color={tokens.color.accent} onPress={() => navigation.popToTop()}>
              <Icon name="home" color={tokens.color.text} />
            </RoundButton>
          </View>
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
        </SafeAreaView>
      )}

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
        onScale={chooseScale}
        onShowText={chooseShowText}
        onLanguage={chooseStoryLanguage}
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
  overlay: { flex: 1, justifyContent: 'space-between', paddingHorizontal: tokens.spacing.medium, paddingVertical: tokens.spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  side: { width: 64, alignItems: 'center', gap: tokens.spacing.medium },
  pagePill: { paddingHorizontal: 10, paddingVertical: 2, borderRadius: tokens.radius.pill, backgroundColor: tokens.color.surface, ...tokens.shadow.card },
  ltr: { writingDirection: 'ltr' },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  textCard: {
    width: '100%',
    maxWidth: 1000,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing.sm,
    paddingHorizontal: tokens.spacing.sm,
    paddingVertical: tokens.spacing.sm,
    borderRadius: tokens.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    ...tokens.shadow.card,
  },
  textGreyed: { opacity: 0.6 },
  wordNow: { color: tokens.color.primary },
  wordLater: { color: tokens.color.textMuted },
  guideFace: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 2, borderColor: tokens.color.accent, backgroundColor: '#FFE9A8' },
  guideFaceImage: { width: 64, height: 74, marginStart: -12, marginTop: -2 },
  introOverlay: { flex: 1, paddingHorizontal: tokens.spacing.medium, paddingVertical: tokens.spacing.sm },
  introRow: { flex: 1, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: tokens.spacing.md },
  bubble: {
    flexShrink: 1,
    maxWidth: 560,
    marginBottom: tokens.spacing.xl,
    gap: tokens.spacing.sm,
    padding: tokens.spacing.lg,
    borderRadius: tokens.radius.lg,
    backgroundColor: tokens.color.surface,
    ...tokens.shadow.card,
  },
  bubbleText: { flexDirection: 'row' },
  introButtons: { flexDirection: 'row', alignItems: 'center', gap: tokens.spacing.sm },
  pageText: { flex: 1, color: tokens.color.text, textAlign: 'center' },
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
