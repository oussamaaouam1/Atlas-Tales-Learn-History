/** Splash video timings (owner, BACKLOG #28). Full video ≈ 6.0 s, short ≈ 2.0 s. */
export function splashTiming(firstLaunch: boolean) {
  const videoMs = firstLaunch ? 6000 : 2000;
  return {
    videoMs,
    /** When the localized title fades in over the video. */
    brandAtMs: firstLaunch ? 4300 : 300,
    /** Pause on the final frame with the title before moving on. */
    holdAfterEndMs: firstLaunch ? 900 : 700,
    /** Safety net if the video never loads or never ends. */
    maxMs: videoMs + 3000,
  };
}
