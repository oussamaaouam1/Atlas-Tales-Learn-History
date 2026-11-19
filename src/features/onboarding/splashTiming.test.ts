import { splashTiming } from './splashTiming';

describe('splash video timing', () => {
  test.each([true, false])('first launch %s: title appears during the video and the safety net comes after it', (first) => {
    const t = splashTiming(first);
    expect(t.brandAtMs).toBeGreaterThan(0);
    expect(t.brandAtMs).toBeLessThan(t.videoMs);
    expect(t.maxMs).toBeGreaterThan(t.videoMs + t.holdAfterEndMs);
  });

  test('later launches are short', () => {
    expect(splashTiming(false).videoMs).toBeLessThan(splashTiming(true).videoMs);
    expect(splashTiming(false).videoMs).toBeLessThanOrEqual(2000);
  });
});
