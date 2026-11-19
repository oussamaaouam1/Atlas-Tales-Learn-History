import { useEventListener } from 'expo';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { MapBackdrop } from './MapBackdrop';
import { splashIcons, splashVideo } from './onboardingArt';
import { splashTiming } from './splashTiming';

/**
 * Splash (owner, BACKLOG #28): the owner's paper-boat video, full on first launch and short
 * afterwards, silent; tap to skip. The localized title fades in over the end as real text.
 * Reduce motion: the calm static splash from the design instead.
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
  return <VideoSplash firstLaunch={next === 'Age'} icon={icon} onDone={leave} />;
}

function VideoSplash({ firstLaunch, icon, onDone }: { firstLaunch: boolean; icon: number; onDone: () => void }) {
  const { t } = useLanguage();
  const timing = splashTiming(firstLaunch);
  const [showBrand, setShowBrand] = useState(false);
  const player = useVideoPlayer(firstLaunch ? splashVideo.full : splashVideo.short, (p) => {
    p.muted = true;
    p.loop = false;
    p.play();
  });

  useEventListener(player, 'playToEnd', () => {
    setTimeout(onDone, timing.holdAfterEndMs);
  });

  useEffect(() => {
    const brand = setTimeout(() => setShowBrand(true), timing.brandAtMs);
    // Safety net: never get stuck on the splash if the video fails to load or end.
    const safety = setTimeout(onDone, timing.maxMs);
    return () => {
      clearTimeout(brand);
      clearTimeout(safety);
    };
  }, [onDone, timing.brandAtMs, timing.maxMs]);

  return (
    <Pressable style={styles.root} onPress={onDone} accessibilityRole="button" accessibilityLabel={t('common.skip')}>
      <MapBackdrop />
      <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="cover" nativeControls={false} pointerEvents="none" />
      {showBrand && (
        <SafeAreaView style={styles.center} pointerEvents="none">
          <Brand icon={icon} />
        </SafeAreaView>
      )}
    </Pressable>
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

function Brand({ icon, withDots = false }: { icon: number; withDots?: boolean }) {
  const { t } = useLanguage();
  return (
    <Animated.View entering={FadeIn.duration(500)} style={styles.brand}>
      <View style={styles.icon}>
        <Image source={splashIcons[icon % splashIcons.length]} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
      </View>
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
  dots: { flexDirection: 'row', gap: 8, marginTop: tokens.spacing.md },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
