import { frameDuration, gestureSequence } from './gesture';

describe('guide gesture frames', () => {
  test('two frames alternate and end at rest', () => {
    expect(gestureSequence(2)).toEqual([0, 1, 0, 1, 0]);
  });

  test('three frames wave back and forth smoothly (never jump from first to last)', () => {
    const sequence = gestureSequence(3);
    expect(sequence).toEqual([0, 1, 2, 1, 0, 1, 2, 1, 0]);
    for (let i = 1; i < sequence.length; i++) expect(Math.abs(sequence[i]! - sequence[i - 1]!)).toBe(1);
  });

  test('multi-frame gestures play faster than two-frame ones', () => {
    expect(frameDuration(3)).toBeLessThan(frameDuration(2));
    expect(gestureSequence(1)).toEqual([0]);
  });
});
