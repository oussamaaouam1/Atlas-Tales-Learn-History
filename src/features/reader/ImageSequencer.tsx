import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

const CROSSFADE_MS = 700; // design token: image-crossfade 700 ms, ease-in-out
const PAN_MS = 10_000; // design: slow pan runs 8–12 s

interface Layer {
  key: string;
  url: string;
  /** Alternates the Ken Burns direction so consecutive images do not move the same way. */
  variant: number;
}

/**
 * Full-bleed story art (§7.2): crossfade between images and a slow pan-and-zoom (Ken Burns).
 * The art never mirrors in Arabic. Reduce motion: plain crossfade, no pan.
 */
export function ImageSequencer({ url, imageKey, dimmed = false }: { url: string | undefined; imageKey: string; dimmed?: boolean }) {
  const [layers, setLayers] = useState<Layer[]>([]);
  useEffect(() => {
    if (!url) return;
    setLayers((current) => {
      if (current.at(-1)?.key === imageKey) return current;
      const variant = (current.at(-1)?.variant ?? 0) + 1;
      // Keep only the previous image under the new one while it fades in.
      return [...current.slice(-1), { key: imageKey, url, variant }];
    });
  }, [url, imageKey]);

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      {layers.map((layer) => (
        <ArtLayer key={layer.key} layer={layer} />
      ))}
      {dimmed && <View style={[StyleSheet.absoluteFill, styles.dim]} />}
    </View>
  );
}

function ArtLayer({ layer }: { layer: Layer }) {
  const still = useReducedMotion();
  const opacity = useSharedValue(0);
  const pan = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: CROSSFADE_MS, easing: Easing.inOut(Easing.ease) });
    if (!still) pan.value = withTiming(1, { duration: PAN_MS, easing: Easing.linear });
  }, [opacity, pan, still]);

  const direction = layer.variant % 2 === 0 ? 1 : -1;
  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: 1.04 + pan.value * 0.06 },
      { translateX: direction * (pan.value - 0.5) * 18 },
      { translateY: (pan.value - 0.5) * -8 },
    ],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, style]}>
      <Image source={{ uri: layer.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} accessibilityIgnoresInvertColors />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#2B3A55', overflow: 'hidden', direction: 'ltr' },
  dim: { backgroundColor: 'rgba(20, 33, 61, 0.55)' },
});
