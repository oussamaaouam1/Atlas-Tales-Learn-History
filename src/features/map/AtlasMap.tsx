import { Image } from 'expo-image';
import { usePaginatedQuery } from 'convex/react';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../../convex/_generated/api';
import type { Doc } from '../../../convex/_generated/dataModel';
import { AppText } from '../../components/AppText';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { continentAt, continents, groupNearby, placements, storyPoint, worldHeight, worldWidth, type Continent } from './geography';
import { continentArt, continentAspect } from './continentArt';

type Story = Doc<'stories'>;
type Props = {
  continent?: Continent;
  openContinent: (continent: Continent) => void;
  openStory: (slug: string) => void;
  openPassport: () => void;
  openSettings?: () => void;
};

export function AtlasMap({ continent, openContinent, openStory, openPassport, openSettings }: Props) {
  const { language, t } = useLanguage();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [choices, setChoices] = useState<Story[]>([]);
  const [selected, setSelected] = useState<string>();
  const { results, status, loadMore } = usePaginatedQuery(api.stories.listForMap, continent ? {} : 'skip', { initialNumItems: 100 });
  const stories = useMemo(() => continent ? results.filter(s => continentAt(s.location.lat, s.location.lng) === continent) : [], [results, continent]);
  const showMore = status === 'CanLoadMore';
  const frame = continent ? { width: worldHeight * continentAspect[continent], height: worldHeight } : { width: worldWidth, height: worldHeight };
  const zoom = Math.min(size.width / frame.width, size.height / frame.height) * (continent ? 0.84 : 1);
  const canvasWidth = frame.width * zoom;
  const canvasHeight = frame.height * zoom;
  const groups = groupNearby(stories.map(story => {
    const p = storyPoint(continent!, story.location.lat, story.location.lng);
    return { x: p.x * canvasWidth, y: p.y * canvasHeight, item: story };
  }), 44);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const scale = useSharedValue(1);
  const startScale = useSharedValue(1);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);
  const depth = useSharedValue(0);
  const entrance = useSharedValue(continent ? 0.82 : 1);
  useEffect(() => {
    entrance.value = withTiming(1, { duration: 420 });
  }, [entrance]);
  const pan = Gesture.Pan().enabled(!!continent).minDistance(8).onStart(() => {
    startX.value = panX.value;
    startY.value = panY.value;
  }).onUpdate(event => {
    const maxX = Math.max(0, (canvasWidth * scale.value - canvasWidth) / 2);
    const maxY = Math.max(0, (canvasHeight * scale.value - canvasHeight) / 2);
    panX.value = Math.max(-maxX, Math.min(maxX, startX.value + event.translationX));
    panY.value = Math.max(-maxY, Math.min(maxY, startY.value + event.translationY));
  });
  const pinch = Gesture.Pinch().enabled(!!continent).onStart(() => {
    startScale.value = scale.value;
  }).onUpdate(event => {
    scale.value = Math.max(1, Math.min(2.6, startScale.value * event.scale));
    const maxX = canvasWidth * (scale.value - 1) / 2;
    const maxY = canvasHeight * (scale.value - 1) / 2;
    panX.value = Math.max(-maxX, Math.min(maxX, panX.value));
    panY.value = Math.max(-maxY, Math.min(maxY, panY.value));
  });
  const animated = useAnimatedStyle(() => ({
    transform: [{ translateX: panX.value }, { translateY: panY.value - depth.value * 5 }, { scale: scale.value * entrance.value * (1 + depth.value * 0.06) }],
  }));
  function selectStory(story: Story) {
    setChoices([]);
    setSelected(story.slug);
    depth.value = 0;
    depth.value = withTiming(1, { duration: 230 });
    openStory(story.slug);
  }

  return (
    <SafeAreaView style={styles.ocean} edges={continent ? ['bottom', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
      <View style={styles.toolbar}>
        <View style={styles.chip}><AppText variant="title" bold>{continent ? t(`map.${continent}`) : t('map.explore')}</AppText></View>
        <View style={styles.actions}>
          <Pressable style={[styles.chip, styles.passport]} accessibilityRole="button" onPress={openPassport}><AppText bold>{t('map.openPassport')}</AppText></Pressable>
          {openSettings && <Pressable style={[styles.chip, styles.settings]} accessibilityRole="button" onPress={openSettings}><AppText bold color="textOnPrimary">{t('map.openSettings')}</AppText></Pressable>}
        </View>
      </View>
      <View style={styles.stage} onLayout={event => setSize(event.nativeEvent.layout)}>
        <GestureDetector gesture={Gesture.Simultaneous(pan, pinch)}>
          <Animated.View style={[styles.canvas, { width: canvasWidth, height: canvasHeight }, animated]}>
                        {zoom > 0 && !continent && (
              <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={canvasWidth} height={canvasHeight} viewBox="0 0 1000 510">
                <Path d="M235 145 Q356 112 444 184 M334 306 Q414 406 533 342 M613 261 Q698 302 798 320" fill="none" stroke="#EAF9FF" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 8" />
                <Circle cx="103" cy="382" r="24" fill="#C9EFFF" stroke="#316887" strokeWidth="1.5" />
                <Path d="M103 362 L109 382 L103 402 L97 382 Z M83 382 L123 382" fill="#316887" stroke="#316887" strokeWidth="2" />
                <Path d="M57 275 q8 -6 16 0 t16 0 M674 353 q8 -6 16 0 t16 0 M890 472 q8 -6 16 0 t16 0 M346 76 q8 -6 16 0 t16 0" fill="none" stroke="#DFF5FF" strokeWidth="2.5" strokeLinecap="round" />
              </Svg>
            )}
            {zoom > 0 && (continent ? (
              <>
                <Image source={continentArt[continent]} style={StyleSheet.absoluteFill} contentFit="fill" accessibilityIgnoresInvertColors />
                {groups.map(group => {
                  const isSelected = group.items.some(s => s.slug === selected);
                  const isNew = group.items.some(s => Date.now() - s.releaseAt < 7 * 86400000);
                  const single = group.items[0]!;
                  return <Pressable key={single.slug} accessibilityRole="button" accessibilityLabel={group.items.length > 1 ? t('map.storyCount', { count: group.items.length }) : single.title[language]}
                    onPress={() => group.items.length > 1 ? setChoices(group.items) : selectStory(single)}
                    style={[styles.pin, { start: group.x - 22, top: group.y - 40 }, isNew && styles.newPin, isSelected && styles.selectedPin]}>
                    <AppText bold align="center">{group.items.length > 1 ? group.items.length : isNew ? '★' : '◆'}</AppText>
                    <View style={styles.pinPoint} />
                    <View style={styles.pinLabel}>
                      <AppText variant="caption" bold numberOfLines={1}>{single.location.name}</AppText>
                    </View>
                  </Pressable>;
                })}
              </>
            ) : continents.map(key => {
              const box = placements[key];
              return (
                <Pressable key={key} accessibilityRole="button" accessibilityLabel={t(`map.${key}`)} onPress={() => openContinent(key)}
                  style={({ pressed }) => [styles.tile, { start: box.x * zoom, top: box.y * zoom, width: box.width * zoom, height: box.height * zoom }, pressed && styles.raised]}>
                  <Image source={continentArt[key]} style={StyleSheet.absoluteFill} contentFit="fill" accessibilityIgnoresInvertColors />
                  <View style={styles.label}><AppText variant="caption" bold align="center">{t(`map.${key}`)}</AppText></View>
                </Pressable>
              );
            }))}
          </Animated.View>
        </GestureDetector>
      </View>
      {continent && (
        <View style={styles.footer}>
          {status === 'LoadingFirstPage' && <ActivityIndicator color={tokens.color.primary} accessibilityLabel={t('common.loading')} />}
          {status === 'Exhausted' && stories.length === 0 && <AppText color="textMuted">{t('map.empty')}</AppText>}
          {showMore && <Pressable accessibilityRole="button" style={styles.chip} onPress={() => loadMore(100)}><AppText>{t('map.more')}</AppText></Pressable>}
          {stories.length > 0 && <View style={styles.label}><AppText variant="caption" bold>★ {t('map.new')}   ◆ {t('map.storyPin')}</AppText></View>}
        </View>
      )}
      <Modal visible={choices.length > 0} transparent animationType="fade" onRequestClose={() => setChoices([])}>
        <View style={styles.scrim}>
          <View style={styles.picker}>
            <Pressable style={styles.chip} accessibilityRole="button" onPress={() => setChoices([])}><AppText>{t('common.close')}</AppText></Pressable>
            <ScrollView>
              {choices.map((story, index) => <Pressable key={story.slug} style={styles.chip} accessibilityRole="button" onPress={() => selectStory(story)}><AppText bold>{new Intl.NumberFormat(language).format(index + 1)}. {story.title[language]}</AppText></Pressable>)}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ocean: { flex: 1, backgroundColor: '#79C9E8' },
  toolbar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 6, gap: 8 },
  actions: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: '#FFF', borderRadius: 24, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  passport: { backgroundColor: tokens.color.accent },
  settings: { backgroundColor: tokens.color.primary },
  stage: { flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', direction: 'ltr' },
  canvas: { position: 'relative', direction: 'ltr' },
  tile: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  raised: { transform: [{ translateY: -5 }, { scale: 1.04 }] },
  label: { backgroundColor: '#FFF', borderRadius: 22, paddingHorizontal: 8, paddingVertical: 3, ...tokens.shadow.card },
  footer: { alignItems: 'center', paddingBottom: 6 },
  pin: { position: 'absolute', width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: tokens.color.text, backgroundColor: '#FFF', alignItems: 'center', justifyContent: 'center', ...tokens.shadow.card },
  pinPoint: { position: 'absolute', bottom: -6, height: 8, width: 8, borderRadius: 2, backgroundColor: tokens.color.text, transform: [{ rotate: '45deg' }] },
  newPin: { backgroundColor: tokens.color.secondary, borderColor: '#FFF' },
  pinLabel: { position: 'absolute', top: 47, minWidth: 60, maxWidth: 130, alignItems: 'center', backgroundColor: '#FFF', paddingHorizontal: 7, borderRadius: 14 },
  selectedPin: { borderColor: tokens.color.primary, transform: [{ scale: 1.16 }] },
  scrim: { flex: 1, backgroundColor: tokens.color.overlay, alignItems: 'center', justifyContent: 'center', padding: 16 },
  picker: { backgroundColor: '#FFF', borderRadius: 24, padding: 12, width: '85%', maxWidth: 440, maxHeight: '90%' },
});
