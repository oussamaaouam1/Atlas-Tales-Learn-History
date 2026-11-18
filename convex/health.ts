import { query } from './_generated/server';

/** Connectivity check used by the app shell (Phase 0 acceptance: "Convex connected"). */
export const ping = query({
  args: {},
  handler: async () => {
    return { ok: true as const, service: 'atlas-tales' };
  },
});
