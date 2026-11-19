import { memo, useEffect, useMemo } from 'react';
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
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { G, Path, Rect } from 'react-native-svg';

import type { Doc } from '../../../convex/_generated/dataModel';
import { AppText } from '../../components/AppText';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { continentAt, continents, groupNearby, type Continent } from './geography';
import { buildContinentPaths, continentFill, labelAnchors, OCEAN, project, VIEW_HEIGHT, VIEW_WIDTH } from './worldShapes';

type Story = Doc<'stories'>;

const NAVY = tokens.color.text;
const NEW_FOR_MS = 7 * 24 * 60 * 60 * 1000;

// Built once: simplified Natural Earth outlines (≈5k points for the whole world).
const continentPaths = buildContinentPaths();
// Light graticule every 30°, a calm "map" texture under the land.
const graticule = [
  ...[30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((x) => `M${x} 0V${VIEW_HEIGHT}`),
  ...[24, 54, 84, 114, 144].map((y) => `M0 ${y}H${VIEW_WIDTH}`),
].join('');

/** Static land layers. Memoized: they never change after the first render. */
const Land = memo(function Land({ onContinent }: { onContinent: (continent: Continent) => void }) {
  return (
    <>
      <Rect width={VIEW_WIDTH} height={VIEW_HEIGHT} fill={OCEAN} />
      <Path d={graticule} stroke="#A6DBF3" strokeWidth={0.25} strokeDasharray="1.2 1.6" />
      {/* Drop shadow, then a navy rim (coastline only: fills cover inner edges, so no borders show). */}
      {continents.map((c) => (
        <Path key={`s-${c}`} d={continentPaths[c]} translateY={1.4} fill="rgba(20,33,61,0.2)" stroke="rgba(20,33,61,0.2)" strokeWidth={1} />
      ))}
      {continents.map((c) => (
        <Path key={`o-${c}`} d={continentPaths[c]} fill={NAVY} stroke={NAVY} strokeWidth={1} strokeLinejoin="round" />
      ))}
      {continents.map((c) => (
        <G key={`f-${c}`} onPress={() => onContinent(c)}>
          <Path d={continentPaths[c]} fill={continentFill[c]} stroke={continentFill[c]} strokeWidth={0.35} strokeLinejoin="round" />
        </G>
      ))}
    </>
  );
});

interface WorldMapProps {
  width: number;
  height: number;
  stories: readonly Story[];
  onContinent: (continent: Continent) => void;
  onStories: (stories: Story[]) => void;
}

/** Flat Bright Explorer world (§7.1): exact equirectangular pins, never mirrored in Arabic. */
export function WorldMap({ width, height, stories, onContinent, onStories }: WorldMapProps) {
  const { t, language } = useLanguage();
  const sx = width / VIEW_WIDTH;
  const sy = height / VIEW_HEIGHT;
  const toScreen = (lat: number, lng: number) => {
    const p = project(lat, lng);
    return { x: p.x * sx, y: p.y * sy };
  };

  const counts = useMemo(() => {
    const result = Object.fromEntries(continents.map((c) => [c, 0])) as Record<Continent, number>;
    for (const story of stories) result[continentAt(story.location.lat, story.location.lng)] += 1;
    return result;
  }, [stories]);

  const groups = groupNearby(
    stories.map((story) => ({ ...toScreen(story.location.lat, story.location.lng), item: story })),
    26,
  );
  const now = Date.now();

  return (
    <View style={{ width, height }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}>
        <Land onContinent={onContinent} />
      </Svg>

      <LivingLayer width={width} toScreen={toScreen} />

      {continents.map((c) => {
        const [lat, lng] = labelAnchors[c];
        const p = toScreen(lat, lng);
        return (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={counts[c] ? `${t(`map.${c}`)}, ${t('map.storyCount', { count: counts[c] })}` : t(`map.${c}`)}
            onPress={() => onContinent(c)}
            hitSlop={6}
            style={({ pressed }) => [styles.labelSlot, { start: p.x - 70, top: p.y - 16 }, pressed && styles.pressed]}
          >
            <View style={styles.label}>
              <AppText variant="caption" bold>
                {t(`map.${c}`)}
              </AppText>
              {counts[c] > 0 && (
                <View style={styles.count}>
                  <AppText variant="caption" bold color="textOnPrimary">
                    {new Intl.NumberFormat(language).format(counts[c])}
                  </AppText>
                </View>
              )}
            </View>
          </Pressable>
        );
      })}

      {groups.map((group) => {
        const first = group.items[0]!;
        const isNew = group.items.some((s) => now - s.releaseAt < NEW_FOR_MS && now >= s.releaseAt);
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
              { start: group.x - 13, top: group.y - 13 },
              isNew ? styles.pinNew : styles.pinDefault,
              pressed && styles.pressed,
            ]}
          >
            {many ? (
              <AppText variant="caption" bold color={isNew ? 'textOnPrimary' : 'text'} style={styles.pinText}>
                {group.items.length}
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
    <Svg width={14} height={14} viewBox="0 0 24 24">
      {isNew ? (
        <Path d="M12 2.5l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17l-5.9 3.3 1.3-6.5L2.5 9.3l6.6-.8z" fill="#FFFFFF" />
      ) : (
        <Path d="M12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10z" fill={NAVY} />
      )}
    </Svg>
  );
}

// ---------------------------------------------------------------------------------------------
// Living map: calm ambient motion (tokens: "calm, no flashing"). Disabled with reduced motion.

type ToScreen = (lat: number, lng: number) => { x: number; y: number };

const CLOUDS = [
  { lat: 62, width: 74, duration: 70_000, offset: 0.1 },
  { lat: 18, width: 58, duration: 90_000, offset: 0.55 },
  { lat: -38, width: 66, duration: 80_000, offset: 0.8 },
];
const WAVES: [lat: number, lng: number][] = [
  [30, -45], [-25, -20], [-35, 75], [10, -140], [-15, -110], [40, -165], [-50, 150], [5, 70],
];

function LivingLayer({ width, toScreen }: { width: number; toScreen: ToScreen }) {
  const reduceMotion = useReducedMotion();
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {WAVES.map(([lat, lng], i) => (
        <Wave key={`${lat},${lng}`} {...toScreen(lat, lng)} delay={i * 450} still={reduceMotion} />
      ))}
      <Boat from={toScreen(28, -48)} to={toScreen(12, -28)} still={reduceMotion} />
      {CLOUDS.map((cloud) => (
        <Cloud key={cloud.lat} y={toScreen(cloud.lat, 0).y} span={width} {...cloud} still={reduceMotion} />
      ))}
    </View>
  );
}

function useLoop(duration: number, still: boolean, options: { reverse?: boolean; delay?: number } = {}): SharedValue<number> {
  const progress = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    progress.value = withDelay(
      options.delay ?? 0,
      withRepeat(withTiming(1, { duration, easing: options.reverse ? Easing.inOut(Easing.sin) : Easing.linear }), -1, options.reverse ?? false),
    );
  }, [progress, duration, still, options.reverse, options.delay]);
  return progress;
}

function Wave({ x, y, delay, still }: { x: number; y: number; delay: number; still: boolean }) {
  const progress = useLoop(2600, still, { reverse: true, delay });
  const style = useAnimatedStyle(() => ({
    opacity: still ? 0.7 : 0.35 + progress.value * 0.55,
    transform: [{ translateX: progress.value * 3 }],
  }));
  return (
    <Animated.View style={[styles.wave, { start: x - 9, top: y - 4 }, style]}>
      <Svg width={18} height={8} viewBox="0 0 18 8">
        <Path d="M1 5q2-3 4 0t4 0t4 0t4 0" stroke="#E8F8FF" strokeWidth={1.6} fill="none" strokeLinecap="round" />
      </Svg>
    </Animated.View>
  );
}

function Boat({ from, to, still }: { from: { x: number; y: number }; to: { x: number; y: number }; still: boolean }) {
  const travel = useLoop(16_000, still, { reverse: true });
  const bob = useLoop(1800, still, { reverse: true });
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: from.x + (to.x - from.x) * travel.value - 12 },
      { translateY: from.y + (to.y - from.y) * travel.value - 12 + bob.value * 2 },
      { rotate: `${(bob.value - 0.5) * 6}deg` },
    ],
  }));
  return (
    <Animated.View style={[styles.boat, style]}>
      <Svg width={24} height={24} viewBox="0 0 24 24">
        <Path d="M12 3v12" stroke={NAVY} strokeWidth={1.4} />
        <Path d="M12.8 4l6 9h-6z" fill="#FFFFFF" stroke={NAVY} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M11.2 6l-4.5 7h4.5z" fill={tokens.color.accent} stroke={NAVY} strokeWidth={1.2} strokeLinejoin="round" />
        <Path d="M3 15.5h18l-3 4.5H6z" fill={tokens.color.secondary} stroke={NAVY} strokeWidth={1.3} strokeLinejoin="round" />
      </Svg>
    </Animated.View>
  );
}

function Cloud({ y, span, width, duration, offset, still }: { y: number; span: number; width: number; duration: number; offset: number; still: boolean }) {
  const progress = useLoop(duration, still);
  const style = useAnimatedStyle(() => {
    const t = (progress.value + offset) % 1;
    return { transform: [{ translateX: -width + t * (span + width) }] };
  });
  return (
    <Animated.View style={[styles.cloud, { top: y - width * 0.2, width, height: width * 0.42 }, style]}>
      <Svg width={width} height={width * 0.42} viewBox="0 0 50 21">
        <Path d="M10 20h31a8 8 0 0 0 0-16a10 10 0 0 0-18-2a8 8 0 0 0-13 7a6 6 0 0 0 0 11z" fill="#FFFFFF" opacity={0.85} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  labelSlot: { position: 'absolute', width: 140, alignItems: 'center' },
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
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.color.primary,
  },
  pin: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...tokens.shadow.card,
  },
  pinDefault: { backgroundColor: '#FFFFFF', borderColor: NAVY },
  pinNew: { backgroundColor: tokens.color.secondary, borderColor: '#FFFFFF' },
  pinText: { lineHeight: 16 },
  pressed: { transform: [{ scale: 0.96 }] },
  wave: { position: 'absolute' },
  boat: { position: 'absolute', start: 0, top: 0 },
  cloud: { position: 'absolute', start: 0 },
});
