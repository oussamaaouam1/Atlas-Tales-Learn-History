import { Image, type ImageSource } from 'expo-image';
import { useEffect, useState } from 'react';
import { I18nManager, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const FRAME_MS = 380; // one half of a wave / point
const GESTURE_SWAPS = 4; // a short burst: a-b-a-b-a
const REST_MS = 2600; // calm pause between bursts

interface AnimatedGuideProps {
  /** Two matching frames of the same pose (e.g. wave-a / wave-b). */
  frames: readonly [ImageSource, ImageSource];
  width: number;
  height: number;
  /** Mirror in right-to-left layouts so the character faces the content (default true). */
  mirrorInRTL?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle;
}

/**
 * Guide character with gentle life: constant idle breathing/bob, plus a short wave or point
 * gesture every few seconds. Calm motion only; static when the OS asks to reduce motion.
 */
export function AnimatedGuide({ frames, width, height, mirrorInRTL = true, accessibilityLabel, style }: AnimatedGuideProps) {
  const still = useReducedMotion();
  const frame = useGestureFrames(still);

  const breath = useSharedValue(0);
  useEffect(() => {
    if (still) return;
    breath.value = withRepeat(withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [breath, still]);

  const flip = mirrorInRTL && I18nManager.isRTL ? -1 : 1;
  const idle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -breath.value * 4 },
      { scaleX: flip * (1 + breath.value * 0.01) },
      { scaleY: 1 + breath.value * 0.018 },
    ],
  }));

  return (
    <View
      style={[{ width, height }, style]}
      accessible={accessibilityLabel != null}
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      <Animated.View style={[StyleSheet.absoluteFill, styles.origin, idle]}>
        {/* Both frames stay mounted so swapping never flickers while an image decodes. */}
        <Image source={frames[0]} style={[StyleSheet.absoluteFill, frame === 1 && styles.hidden]} contentFit="contain" accessibilityIgnoresInvertColors />
        <Image source={frames[1]} style={[StyleSheet.absoluteFill, frame === 0 && styles.hidden]} contentFit="contain" accessibilityIgnoresInvertColors />
      </Animated.View>
    </View>
  );
}

/** 0/1 frame index: a burst of swaps, then rest. */
export function useGestureFrames(still: boolean): 0 | 1 {
  const [frame, setFrame] = useState<0 | 1>(0);
  useEffect(() => {
    if (still) {
      setFrame(0);
      return;
    }
    let swaps = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (swaps < GESTURE_SWAPS) {
        swaps += 1;
        setFrame((f) => (f === 0 ? 1 : 0));
        timer = setTimeout(tick, FRAME_MS);
      } else {
        swaps = 0;
        setFrame(0);
        timer = setTimeout(tick, REST_MS);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [still]);
  return frame;
}

const styles = StyleSheet.create({
  origin: { transformOrigin: 'bottom' },
  hidden: { opacity: 0 },
});
