import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import { DirectionalIcon } from '../../components/DirectionalIcon';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { MapBackdrop } from './MapBackdrop';
import { splashIcons, splashVideo } from './onboardingArt';
import { splashTiming } from './splashTiming';

/**
 * Splash (owner, BACKLOG #28, #30): the owner's paper-boat video, played in full on every launch,
 * silent, with a Skip button; no title over it. Reduce motion: the calm static splash instead.
 */
export function SplashScreen({ navigation, route }: RootScreenProps<'Splash'>) {
  const { next, icon } = route.params;
  const reduceMotion = useReducedMotion();
  const done = useRef(false);
  const leave = useCallback(() => {
    if (done.current) return;
    done.current = true;
    navigation.replace(next);
  }, [navigation, next]);

  if (reduceMotion) return <StaticSplash icon={icon} onDone={leave} />;
  return <VideoSplash onDone={leave} />;
}

function VideoSplash({ onDone }: { onDone: () => void }) {
  const { t } = useLanguage();
  const timing = splashTiming();
  const player = useVideoPlayer(splashVideo, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEventListener(player, 'playToEnd', () => {
    setTimeout(onDone, timing.holdAfterEndMs);
  });

  useEffect(() => {
    // Safety net: never get stuck on the splash if the video fails to load or end.
    const safety = setTimeout(onDone, timing.maxMs);
    return () => clearTimeout(safety);
  }, [onDone, timing.maxMs]);

  return (
    <View style={styles.root}>
      <MapBackdrop />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      <SafeAreaView style={styles.skipArea} edges={['top', 'left', 'right']} pointerEvents="box-none">
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          accessibilityLabel={t('common.skip')}
          hitSlop={10}
          style={({ pressed }) => [styles.skip, pressed && styles.skipPressed]}
        >
          <AppText bold color="textOnPrimary">{t('common.skip')}</AppText>
          <DirectionalIcon direction="forward" size={16} color={tokens.color.textOnPrimary} />
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

function StaticSplash({ icon, onDone }: { icon: number; onDone: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1500); // design: about 1.5 s, then a 300 ms fade
    return () => clearTimeout(timer);
  }, [onDone]);
  return (
    <View style={styles.root}>
      <MapBackdrop />
      <SafeAreaView style={styles.center}>
        <Brand icon={icon} withDots />
      </SafeAreaView>
    </View>
  );
}

function Brand({ icon, withDots = false, showIcon = true }: { icon: number; withDots?: boolean; showIcon?: boolean }) {
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
      {/* The icon clashes with the video (owner, BACKLOG #29): title only over the video. */}
      {showIcon && (
        <View style={styles.icon}>
          <Image source={splashIcons[icon % splashIcons.length]} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
        </View>
      )}
      <AppText variant="display" align="center">
        {t('splash.title')}
      </AppText>
      <AppText variant="bodyLarge" bold color="primary" align="center" style={styles.subtitle}>
        {t('splash.subtitle')}
      </AppText>
      {withDots && <LoadingDots />}
    </Animated.View>
  );
}

/** Three dots; the active one travels in reading direction (row order follows RTL). */
function LoadingDots() {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withRepeat(withTiming(3, { duration: 1500 }), -1, false);
  }, [progress]);
  return (
    <View style={styles.dots} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 1, 2].map((i) => (
        <Dot key={i} index={i} progress={progress} />
      ))}
    </View>
  );
}

function Dot({ index, progress }: { index: number; progress: { value: number } }) {
  const style = useAnimatedStyle(() => ({
    backgroundColor: Math.floor(progress.value) % 3 === index ? tokens.color.primary : '#AFC3E6',
  }));
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.background },
  center: { position: 'absolute', top: 0, bottom: 0, start: 0, end: 0, alignItems: 'center', justifyContent: 'center' },
  brand: {
    alignItems: 'center',
    gap: tokens.spacing.xs,
    paddingHorizontal: tokens.spacing.xl,
    paddingVertical: tokens.spacing.md,
    borderRadius: tokens.radius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
  },
  icon: {
    width: 104,
    height: 104,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: tokens.spacing.sm,
    backgroundColor: tokens.color.accent,
    ...tokens.shadow.card,
  },
  subtitle: { marginTop: -6 },
  skipArea: { position: 'absolute', top: 0, start: 0, end: 0, alignItems: 'flex-end', padding: tokens.spacing.md },
  skip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: tokens.spacing.md,
    borderRadius: tokens.radius.pill,
    backgroundColor: 'rgba(20, 33, 61, 0.55)',
  },
  skipPressed: { opacity: 0.8, transform: [{ scale: 0.96 }] },
  dots: { flexDirection: 'row', gap: 8, marginTop: tokens.spacing.md },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
