import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export const ageBandValidator = v.union(
  v.literal('child'),
  v.literal('teen'),
  v.literal('adult'),
  v.literal('unknown'),
);

export const platformValidator = v.union(v.literal('ios'), v.literal('android'), v.literal('web'));

// BUILD_GUIDE §5. Content tables arrive in Phase 2.
export default defineSchema({
  // Identity: one row per app install (anonymous first, §4).
  // The raw install token never leaves the device's SecureStore; only its SHA-256 hash is stored.
  installs: defineTable({
    ownerKey: v.string(),
    installTokenHash: v.string(),
    platform: platformValidator,
    appVersion: v.string(),
    locale: v.string(),
    linkedUserKey: v.optional(v.string()),
    ageBand: ageBandValidator,
    firstSeenAtMs: v.number(),
    lastSeenAtMs: v.number(),
  })
    .index('by_ownerKey', ['ownerKey'])
    .index('by_installTokenHash', ['installTokenHash']),
});
