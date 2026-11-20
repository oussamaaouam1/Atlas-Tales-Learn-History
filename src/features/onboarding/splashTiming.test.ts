import { splashTiming } from './splashTiming';

test('the full video plays, then the safety net only fires after it would have ended', () => {
  const t = splashTiming();
  expect(t.videoMs).toBeGreaterThanOrEqual(5900);
  expect(t.maxMs).toBeGreaterThan(t.videoMs + t.holdAfterEndMs);
});
