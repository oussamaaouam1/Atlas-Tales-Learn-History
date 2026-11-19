import { Image } from 'expo-image';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../components/AppText';
import type { RootScreenProps } from '../../navigation/types';
import { useLanguage } from '../../providers/LanguageProvider';
import { tokens } from '../../theme/tokens';
import { appIcon } from './onboardingArt';
import { MapBackdrop } from './MapBackdrop';

const SPLASH_MS = 1500; // design: about 1.5 s, then a 300 ms fade (screen animation 'fade')

export function SplashScreen({ navigation, route }: RootScreenProps<'Splash'>) {
  const { t } = useLanguage();
  const { next } = route.params;

  useEffect(() => {
    const timer = setTimeout(() => navigation.replace(next), SPLASH_MS);
    return () => clearTimeout(timer);
  }, [navigation, next]);

  return (
    <View style={styles.root}>
      <MapBackdrop />
      <SafeAreaView style={styles.center}>
        <Animated.View entering={FadeIn.duration(300)} style={styles.brand}>
          <View style={styles.icon}>
            <Image source={appIcon} style={StyleSheet.absoluteFill} contentFit="cover" accessibilityIgnoresInvertColors />
          </View>
          <AppText variant="display" align="center">
            {t('splash.title')}
          </AppText>
          <AppText variant="bodyLarge" bold color="primary" align="center" style={styles.subtitle}>
            {t('splash.subtitle')}
          </AppText>
          <LoadingDots />
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

/** Three dots; the active one travels in reading direction (row order follows RTL). */
function LoadingDots() {
  const still = useReducedMotion();
  const progress = useSharedValue(0);
  useEffect(() => {
    if (!still) progress.value = withRepeat(withTiming(3, { duration: 1500 }), -1, false);
  }, [progress, still]);
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: { alignItems: 'center', gap: tokens.spacing.xs },
  icon: {
    width: 112,
    height: 112,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: tokens.spacing.sm,
    backgroundColor: tokens.color.accent,
    ...tokens.shadow.card,
  },
  subtitle: { marginTop: -6 },
  dots: { flexDirection: 'row', gap: 8, marginTop: tokens.spacing.md },
  dot: { width: 9, height: 9, borderRadius: 5 },
});
