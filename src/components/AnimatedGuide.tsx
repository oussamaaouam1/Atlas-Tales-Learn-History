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

import { frameDuration, gestureSequence } from './gesture';

const REST_MS = 2600; // calm pause between bursts

interface AnimatedGuideProps {
  /** Two or more matching frames of the same pose (e.g. wave-a / wave-b / wave-c). */
  frames: readonly ImageSource[];
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
  const frame = useGestureFrames(frames.length, still);

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
        {/* All frames stay mounted so swapping never flickers while an image decodes. */}
        {frames.map((source, i) => (
          <Image key={i} source={source} style={[StyleSheet.absoluteFill, frame !== i && styles.hidden]} contentFit="contain" accessibilityIgnoresInvertColors />
        ))}
      </Animated.View>
    </View>
  );
}

/** Current frame index: a gesture burst through the frames, then a calm rest. */
export function useGestureFrames(count: number, still: boolean): number {
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    if (still || count < 2) {
      setFrame(0);
      return;
    }
    const sequence = gestureSequence(count);
    const step = frameDuration(count);
    let index = 0;
    let timer: ReturnType<typeof setTimeout>;
    const tick = () => {
      if (index < sequence.length) {
        setFrame(sequence[index]!);
        index += 1;
        timer = setTimeout(tick, step);
      } else {
        index = 0;
        timer = setTimeout(tick, REST_MS);
      }
    };
    timer = setTimeout(tick, 600);
    return () => clearTimeout(timer);
  }, [count, still]);
  return frame;
}

const styles = StyleSheet.create({
  origin: { transformOrigin: 'bottom' },
  hidden: { opacity: 0 },
});
