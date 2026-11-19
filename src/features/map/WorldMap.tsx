import { Image } from 'expo-image';
import { useEffect, useMemo, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  ZoomIn,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

import type { Doc } from '../../../convex/_generated/dataModel';
import { AppText } from '../../components/AppText';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { continentArt } from './continentArt';
import { continentAt, continents, groupNearby, worldHeight, worldWidth, type Continent } from './geography';
import { continentPinColor, fanOffsets, worldLayout, type WorldLayout } from './worldLayout';

type Story = Doc<'stories'>;
type Point = { x: number; y: number };

export const OCEAN = '#79C9E8';
const NAVY = tokens.color.text;
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

interface WorldMapProps {
  /** Screen (stage) size in px; the world is laid out to fill it exactly. */
  width: number;
  height: number;
  stories: readonly Story[];
  onContinent: (continent: Continent) => void;
  onStories: (stories: Story[]) => void;
}

/** Illustrated world (owner choice): painted continents, living ocean, story pins. Never mirrored. */
export function WorldMap({ width, height, stories, onContinent, onStories }: WorldMapProps) {
  const { t, language } = useLanguage();
  const layout = useMemo(() => worldLayout(width, height), [width, height]);

  const counts = useMemo(() => {
    const result = Object.fromEntries(continents.map((c) => [c, 0])) as Record<Continent, number>;
    for (const story of stories) result[continentAt(story.location.lat, story.location.lng)] += 1;
    return result;
  }, [stories]);

  const groups = groupNearby(
    stories.map((story) => ({ ...layout.story(story.location.lat, story.location.lng), item: story })),
    30,
  );
  const now = Date.now();

  return (
    <View style={{ width, height }}>
      {/* Ocean decoration under the land: routes and compass. */}
      <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width={width} height={height} viewBox={`0 0 ${worldWidth} ${worldHeight}`} preserveAspectRatio="none">
        <Path d="M235 145 Q356 112 444 184 M334 306 Q414 406 533 342 M613 261 Q698 302 798 320" fill="none" stroke="#EAF9FF" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 8" />
      </Svg>
      <Compass at={layout.ocean({ x: 103, y: 382 })} size={48 * layout.s} />

      <OceanLife layout={layout} />

      {continents.map((key, index) => {
        const rect = layout.tile(key);
        return (
          <BouncyTile key={key} index={index} rect={rect}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={counts[key] ? `${t(`map.${key}`)}, ${t('map.storyCount', { count: counts[key] })}` : t(`map.${key}`)}
              onPress={() => onContinent(key)}
              style={({ pressed }) => [styles.tile, pressed && styles.raised]}
            >
              <Image source={continentArt[key]} style={StyleSheet.absoluteFill} contentFit="fill" accessibilityIgnoresInvertColors />
              <View style={styles.label}>
                <AppText variant="caption" bold>
                  {t(`map.${key}`)}
                </AppText>
              </View>
            </Pressable>
          </BouncyTile>
        );
      })}

      <CloudLayer layout={layout} width={width} />

      {/* One location pin per story, coloured by continent; stories at one place fan out. */}
      {groups.flatMap((group) => {
        const offsets = fanOffsets(group.items.length);
        return group.items.map((story, i) => {
          const color = continentPinColor[continentAt(story.location.lat, story.location.lng)];
          const isNew = now >= story.releaseAt && now - story.releaseAt < NEW_FOR_MS;
          const offset = offsets[i]!;
          return (
            <LocationPin
              key={story.slug}
              x={group.x + offset.x}
              y={group.y + offset.y}
              color={color}
              isNew={isNew}
              delay={i * 90}
              label={story.title[language]}
              onPress={() => onStories([story])}
            />
          );
        });
      })}
    </View>
  );
}

function Compass({ at, size }: { at: Point; size: number }) {
  return (
    <Svg pointerEvents="none" style={[styles.abs, { start: at.x - size / 2, top: at.y - size / 2 }]} width={size} height={size} viewBox="0 0 48 48">
      <Circle cx="24" cy="24" r="23" fill="#C9EFFF" stroke="#316887" strokeWidth="1.5" />
      <Path d="M24 4 L30 24 L24 44 L18 24 Z M4 24 L44 24" fill="#316887" stroke="#316887" strokeWidth="2" />
    </Svg>
  );
}

/**
 * A continent that gently floats up and settles, staggered per continent so the map feels alive
 * without everything moving at once (owner, BACKLOG #19, softened in #22). Still with reduce motion.
 */
function BouncyTile({ index, rect, children }: { index: number; rect: { x: number; y: number; width: number; height: number }; children: ReactNode }) {
  const still = useReducedMotion();
  const lift = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    lift.value = withDelay(
      index * 420,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 1400 }),
        ),
        -1,
        false,
      ),
    );
  }, [lift, index, still]);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 2.5 }] }));
  return (
    <Animated.View style={[styles.abs, { start: rect.x, top: rect.y, width: rect.width, height: rect.height }, style]}>
      {children}
    </Animated.View>
  );
}

const PIN_W = 26;
const PIN_H = 34;

/** Classic map pin (teardrop) anchored at its tip, in the continent's colour; new stories show a star. */
function LocationPin(props: { x: number; y: number; color: string; isNew: boolean; delay: number; label: string; onPress: () => void }) {
  const { x, y, color, isNew, delay, label, onPress } = props;
  const still = useReducedMotion();
  return (
    <Animated.View
      entering={still ? undefined : ZoomIn.delay(400 + delay).springify().damping(9)}
      style={[styles.abs, { start: x - PIN_W / 2, top: y - PIN_H, width: PIN_W, height: PIN_H }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => [styles.pinShadow, pressed && styles.pressed]}
      >
        <Svg width={PIN_W} height={PIN_H} viewBox="0 0 26 34">
          <Path
            d="M13 1C6.4 1 1.2 6.1 1.2 12.6C1.2 21.4 13 33 13 33S24.8 21.4 24.8 12.6C24.8 6.1 19.6 1 13 1Z"
            fill={color}
            stroke="#FFFFFF"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {isNew ? (
            <Path d="M13 6.2l1.9 3.9 4.3.6-3.1 3 .7 4.2-3.8-2-3.8 2 .7-4.2-3.1-3 4.3-.6z" fill="#FFFFFF" />
          ) : (
            <Circle cx={13} cy={12.6} r={4.4} fill="#FFFFFF" />
          )}
        </Svg>
      </Pressable>
    </Animated.View>
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
function OceanLife({ layout }: { layout: WorldLayout }) {
  const still = useReducedMotion();
  const at = layout.ocean;
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
function CloudLayer({ layout, width }: { layout: WorldLayout; width: number }) {
  const still = useReducedMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {CLOUDS.map((cloud) => (
        <Cloud key={cloud.y} y={cloud.y * layout.sy} size={cloud.width * layout.s} span={width} duration={cloud.duration} offset={cloud.offset} still={still} />
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
  tile: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  pressed: { transform: [{ scale: 0.92 }] },
  pinShadow: { shadowColor: '#14213D', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  abs: { position: 'absolute' },
  origin: { start: 0, top: 0 },
});
