import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const CROSSFADE_MS = 700; // design token: image-crossfade 700 ms, ease-in-out
const PAN_MS = 10_000; // design: slow pan runs 8–12 s
const FLIP_MS = 650; // page turn (owner, BACKLOG #37)

export type TurnDirection = 'forward' | 'back';

interface Layer {
  key: string;
  url: string;
  page: number;
  /** Alternates the Ken Burns direction so consecutive images do not move the same way. */
  variant: number;
  /** Set on the outgoing picture when the page changes: it flips away like a book page. */
  leaving?: TurnDirection;
}

interface ImageSequencerProps {
  url: string | undefined;
  imageKey: string;
  page: number;
  /** Reading direction of the story text: Arabic books turn the other way. */
  rtl: boolean;
  dimmed?: boolean;
}

/**
 * Full-bleed story art (§7.2): crossfade between images of a page, a page-turn flip between pages,
 * and a slow pan-and-zoom. The art itself never mirrors. Reduce motion: plain crossfade, no pan or flip.
 */
export function ImageSequencer({ url, imageKey, page, rtl, dimmed = false }: ImageSequencerProps) {
  const still = useReducedMotion();
  const [layers, setLayers] = useState<Layer[]>([]);

  useEffect(() => {
    if (!url) return;
    setLayers((current) => {
      const top = current.at(-1);
      if (top?.key === imageKey) return current;
      const variant = (top?.variant ?? 0) + 1;
      const next: Layer = { key: imageKey, url, page, variant };
      if (!top || still || top.page === page) {
        // Same page (or first image): the new image fades in over the previous one.
        return [...current.filter((l) => !l.leaving).slice(-1), next];
      }
      // New page: the new picture sits underneath, the old one turns away on top.
      const direction: TurnDirection = page > top.page ? 'forward' : 'back';
      return [next, { ...top, leaving: direction }];
    });
  }, [url, imageKey, page, still]);

  const remove = (key: string) => setLayers((current) => current.filter((l) => l.key !== key));

  return (
    <View style={[StyleSheet.absoluteFill, styles.root]} pointerEvents="none">
      {layers.map((layer) =>
        layer.leaving ? (
          <FlippingLayer key={`${layer.key}-leaving`} layer={layer} rtl={rtl} onDone={() => remove(layer.key)} />
        ) : (
          <ArtLayer key={layer.key} layer={layer} fadeIn={layers.length > 1 && !layers.some((l) => l.leaving)} still={still} />
        ),
      )}
      {dimmed && <View style={[StyleSheet.absoluteFill, styles.dim]} />}
    </View>
  );
}

function ArtLayer({ layer, fadeIn, still }: { layer: Layer; fadeIn: boolean; still: boolean }) {
  const opacity = useSharedValue(fadeIn ? 0 : 1);
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

/**
 * The previous page turning away: it rotates around the spine edge (left for left-to-right stories,
 * right for Arabic; reversed when going back) with a soft shadow, then disappears.
 */
function FlippingLayer({ layer, rtl, onDone }: { layer: Layer; rtl: boolean; onDone: () => void }) {
  const progress = useSharedValue(0);
  // Keep the latest callback without restarting the animation on every parent render.
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const finish = () => done.current();
    progress.value = withTiming(1, { duration: FLIP_MS, easing: Easing.inOut(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(finish)();
    });
  }, [progress]);

  // Forward in a left-to-right book: the page lifts at the right and turns over the left spine.
  const spineLeft = (layer.leaving === 'forward') !== rtl;
  const sign = spineLeft ? -1 : 1;
  const style = useAnimatedStyle(() => ({
    opacity: progress.value > 0.92 ? (1 - progress.value) / 0.08 : 1,
    transform: [{ perspective: 1400 }, { rotateY: `${sign * progress.value * 95}deg` }, { scale: 1 - progress.value * 0.04 }],
  }));
  const shade = useAnimatedStyle(() => ({ opacity: progress.value * 0.45 }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transformOrigin: spineLeft ? 'left' : 'right' }, style]}>
      <Image source={{ uri: layer.url }} style={StyleSheet.absoluteFill} contentFit="cover" transition={0} accessibilityIgnoresInvertColors />
      <Animated.View style={[StyleSheet.absoluteFill, styles.pageShade, shade]} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { backgroundColor: '#2B3A55', overflow: 'hidden', direction: 'ltr' },
  dim: { backgroundColor: 'rgba(20, 33, 61, 0.55)' },
  pageShade: { backgroundColor: '#14213D' },
});
