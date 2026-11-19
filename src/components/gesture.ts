/**
 * One gesture burst as a frame sequence: back and forth through the frames twice, ending on frame 0.
 * 2 frames: 0 1 0 1 0. 3 frames: 0 1 2 1 0 1 2 1 0 (a smooth wave).
 */
export function gestureSequence(count: number): number[] {
  if (count < 2) return [0];
  const forth = Array.from({ length: count }, (_, i) => i);
  const back = forth.slice(1, -1).reverse();
  const cycle = [...forth, ...back];
  return [...cycle, ...cycle, 0];
}

/** Slower swaps for 2-frame gestures, quicker for smoother multi-frame ones. */
export function frameDuration(count: number): number {
  return count > 2 ? 150 : 380;
}
