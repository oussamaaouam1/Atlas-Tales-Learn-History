import { Image } from 'expo-image';
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Doc } from '../../../convex/_generated/dataModel';
import { AppText } from '../../components/AppText';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { continentArt } from './continentArt';
import { continentAt, continents, groupNearby, placements, storyPoint, worldHeight, worldWidth, type Continent } from './geography';

type Story = Doc<'stories'>;
type Point = { x: number; y: number };

export const OCEAN = '#79C9E8';
const NAVY = tokens.color.text;
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

/** Where a story sits on the illustrated world: inside its continent's artwork box (approximate). */
export function worldPoint(lat: number, lng: number): Point {
  const continent = continentAt(lat, lng);
  const box = placements[continent];
  const p = storyPoint(continent, lat, lng);
  return { x: box.x + p.x * box.width, y: box.y + p.y * box.height };
}

interface WorldMapProps {
  /** Canvas size in px; the world is drawn in 1000 × 510 units scaled to it. */
  width: number;
  height: number;
  stories: readonly Story[];
  onContinent: (continent: Continent) => void;
  onStories: (stories: Story[]) => void;
}

/** Illustrated world (owner choice): painted continents, living ocean, story pins. Never mirrored. */
export function WorldMap({ width, height, stories, onContinent, onStories }: WorldMapProps) {
  const { t, language } = useLanguage();
  const scale = width / worldWidth;
  const toScreen = (p: Point): Point => ({ x: p.x * scale, y: p.y * scale });

  const counts = useMemo(() => {
    const result = Object.fromEntries(continents.map((c) => [c, 0])) as Record<Continent, number>;
    for (const story of stories) result[continentAt(story.location.lat, story.location.lng)] += 1;
    return result;
  }, [stories]);

  const groups = groupNearby(
    stories.map((story) => ({ ...toScreen(worldPoint(story.location.lat, story.location.lng)), item: story })),
    30,
  );
  const now = Date.now();

  return (
    <View style={{ width, height }}>
      {/* Ocean decoration under the land: routes and compass. */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height} viewBox={`0 0 ${worldWidth} ${worldHeight}`}>
        <Path d="M235 145 Q356 112 444 184 M334 306 Q414 406 533 342 M613 261 Q698 302 798 320" fill="none" stroke="#EAF9FF" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 8" />
        <Circle cx="103" cy="382" r="24" fill="#C9EFFF" stroke="#316887" strokeWidth="1.5" />
        <Path d="M103 362 L109 382 L103 402 L97 382 Z M83 382 L123 382" fill="#316887" stroke="#316887" strokeWidth="2" />
      </Svg>

      <OceanLife scale={scale} />

      {continents.map((key) => {
        const box = placements[key];
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={counts[key] ? `${t(`map.${key}`)}, ${t('map.storyCount', { count: counts[key] })}` : t(`map.${key}`)}
            onPress={() => onContinent(key)}
            style={({ pressed }) => [
              styles.tile,
              { start: box.x * scale, top: box.y * scale, width: box.width * scale, height: box.height * scale },
              pressed && styles.raised,
            ]}
          >
            <Image source={continentArt[key]} style={StyleSheet.absoluteFill} contentFit="fill" accessibilityIgnoresInvertColors />
            <View style={styles.label}>
              <AppText variant="caption" bold>
                {t(`map.${key}`)}
              </AppText>
            </View>
          </Pressable>
        );
      })}

      <CloudLayer scale={scale} width={width} />

      {groups.map((group) => {
        const first = group.items[0]!;
        const isNew = group.items.some((s) => now >= s.releaseAt && now - s.releaseAt < NEW_FOR_MS);
        const many = group.items.length > 1;
        return (
          <Pressable
            key={first.slug}
            accessibilityRole="button"
            accessibilityLabel={many ? t('map.storyCount', { count: group.items.length }) : first.title[language]}
            onPress={() => onStories(group.items)}
            hitSlop={10}
            style={({ pressed }) => [
              styles.pin,
              { start: group.x - 15, top: group.y - 15 },
              isNew ? styles.pinNew : styles.pinDefault,
              pressed && styles.pressed,
            ]}
          >
            {many ? (
              <AppText variant="caption" bold color={isNew ? 'textOnPrimary' : 'text'} style={styles.pinText}>
                {new Intl.NumberFormat(language).format(group.items.length)}
              </AppText>
            ) : (
              <PinGlyph isNew={isNew} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

function PinGlyph({ isNew }: { isNew: boolean }) {
  return (
    <Svg width={15} height={15} viewBox="0 0 24 24">
      {isNew ? (
        <Path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFFFFF" />
      ) : (
        <Path d="M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z" fill={NAVY} />
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Living map: calm ambient motion over the open ocean (tokens: "calm, no flashing").
// Positions are in world units (1000 × 510), placed in the gaps between the painted continents.

const CLOUDS = [
  { y: 70, width: 92, duration: 70_000, offset: 0.1 },
  { y: 235, width: 70, duration: 90_000, offset: 0.55 },
  { y: 410, width: 82, duration: 80_000, offset: 0.8 },
];
const WAVES: Point[] = [
  { x: 90, y: 300 }, { x: 150, y: 385 }, { x: 60, y: 440 }, { x: 680, y: 300 },
  { x: 700, y: 385 }, { x: 205, y: 470 }, { x: 770, y: 470 }, { x: 905, y: 475 },
];
const BOAT_ROUTE: [Point, Point] = [{ x: 318, y: 118 }, { x: 366, y: 184 }];

/** Waves and the boat sail on the ocean, under the continents. */
function OceanLife({ scale }: { scale: number }) {
  const still = useReducedMotion();
  const at = (p: Point): Point => ({ x: p.x * scale, y: p.y * scale });
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {WAVES.map((p, i) => (
        <Wave key={`${p.x},${p.y}`} {...at(p)} delay={i * 450} still={still} />
      ))}
      <Boat from={at(BOAT_ROUTE[0])} to={at(BOAT_ROUTE[1])} still={still} />
    </View>
  );
}

/** Clouds drift over the whole map: above the continents, below the story pins. Taps pass through. */
function CloudLayer({ scale, width }: { scale: number; width: number }) {
  const still = useReducedMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CLOUDS.map((cloud) => (
        <Cloud key={cloud.y} y={cloud.y * scale} size={cloud.width * scale} span={width} duration={cloud.duration} offset={cloud.offset} still={still} />
      ))}
    </View>
  );
}

function useLoop(duration: number, still: boolean, options: { reverse?: boolean; delay?: number } = {}): SharedValue<number> {
  const progress = useSharedValue(0);
  const { reverse = false, delay = 0 } = options;
  useEffect(() => {
    if (still) return;
    progress.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration, easing: reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, reverse),
    );
  }, [progress, duration, still, reverse, delay]);
  return progress;
}

function Wave({ x, y, delay, still }: Point & { delay: number; still: boolean }) {
  const progress = useLoop(2600, still, { reverse: true, delay });
  const style = useAnimatedStyle(() => ({
    opacity: still ? 0.7 : 0.35 + progress.value * 0.55,
    transform: [{ translateX: progress.value * 3 }],
  }));
  return (
    <Animated.View style={[styles.abs, { start: x - 11, top: y - 5 }, style]}>
      <Svg width={22} height={10} viewBox="0 0 18 8">
        <Path d="M1 5q2-3 4 0t4 0t4 0t4 0" stroke="#E8F8FF" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function Boat({ from, to, still }: { from: Point; to: Point; still: boolean }) {
  const travel = useLoop(16_000, still, { reverse: true });
  const bob = useLoop(1800, still, { reverse: true });
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: from.x + (to.x - from.x) * travel.value - 14 },
      { translateY: from.y + (to.y - from.y) * travel.value - 14 + bob.value * 2 },
      { rotate: `${(bob.value - 0.5) * 6}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.abs, styles.origin, style]}>
      <Svg width={28} height={28} viewBox="0 0 24 24">
        <Path d="M12 3v12" stroke={NAVY} strokeWidth={1.4} />
        <Path d="M12.8 4l6 9h-6z" fill="#FFFFFF" stroke={NAVY} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M11.2 6l-4.5 7h4.5z" fill={tokens.color.accent} stroke={NAVY} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M3 15.5h18l-3 4.5H6z" fill={tokens.color.secondary} stroke={NAVY} strokeWidth={1.3} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function Cloud(props: { y: number; size: number; span: number; duration: number; offset: number; still: boolean }) {
  const { y, size, span, duration, offset, still } = props;
  const progress = useLoop(duration, still);
  const style = useAnimatedStyle(() => {
    const t = (progress.value + offset) % 1;
    return { transform: [{ translateX: -size + t * (span + size) }] };
  });
  return (
    <Animated.View style={[styles.abs, styles.origin, { top: y - size * 0.2, width: size, height: size * 0.42 }, style]}>
      <Svg width={size} height={size * 0.42} viewBox="0 0 50 21">
        <Path d="M10 20h31a8 8 0 0 0 0-16a10 10 0 0 0-18-2a8 8 0 0 0-13 7a6 6 0 0 0 0 11z" fill="#FFFFFF" opacity={0.85} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
  raised: { transform: [{ translateY: -5 }, { scale: 1.04 }] },
  label: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: tokens.color.surface,
    borderRadius: tokens.radius.pill,
    paddingHorizontal: 10,
    minHeight: 30,
    ...tokens.shadow.card,
  },
  pin: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.card,
  },
  pinDefault: { backgroundColor: '#FFFFFF', borderColor: NAVY },
  pinNew: { backgroundColor: tokens.color.secondary, borderColor: '#FFFFFF' },
  pinText: { lineHeight: 16 },
  pressed: { transform: [{ scale: 0.96 }] },
  abs: { position: 'absolute' },
  origin: { start: 0, top: 0 },
});
