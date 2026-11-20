/** Splash video timings (owner, BACKLOG #28, #30): the full ≈ 6.0 s video on every launch. */
export function splashTiming() {
  const videoMs = 6000;
  return {
    videoMs,
    /** Short pause on the final frame before moving on. */
    holdAfterEndMs: 300,
    /** Safety net if the video never loads or never ends. */
    maxMs: videoMs + 3000,
  };
}
