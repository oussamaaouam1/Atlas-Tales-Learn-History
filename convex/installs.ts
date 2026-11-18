import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import {
  assertValidInstallToken,
  assertValidOwnerKey,
  hashInstallToken,
  requireInstall,
} from './lib/installAuth';
import { ageBandValidator, platformValidator } from './schema';

const installStateValidator = v.object({ ownerKey: v.string(), ageBand: ageBandValidator });

/**
 * Creates the install row on first launch, or refreshes it on later launches.
 * Idempotent: the same ownerKey + token always maps to the same row.
 */
export const register = mutation({
  args: {
    ownerKey: v.string(),
    installToken: v.string(),
    platform: platformValidator,
    appVersion: v.string(),
    locale: v.string(),
  },
  returns: installStateValidator,
  handler: async (ctx, args) => {
    assertValidOwnerKey(args.ownerKey);
    assertValidInstallToken(args.installToken);
    const installTokenHash = await hashInstallToken(args.installToken);
    const now = Date.now();

    const existing = await ctx.db
      .query('installs')
      .withIndex('by_ownerKey', (q) => q.eq('ownerKey', args.ownerKey))
      .unique();

    if (existing) {
      if (existing.installTokenHash !== installTokenHash) {
        throw new ConvexError('Install token does not match');
      }
      await ctx.db.patch('installs', existing._id, {
        platform: args.platform,
        appVersion: args.appVersion,
        locale: args.locale,
        lastSeenAtMs: now,
      });
      return { ownerKey: existing.ownerKey, ageBand: existing.ageBand };
    }

    await ctx.db.insert('installs', {
      ownerKey: args.ownerKey,
      installTokenHash,
      platform: args.platform,
      appVersion: args.appVersion,
      locale: args.locale,
      ageBand: 'unknown',
      firstSeenAtMs: now,
      lastSeenAtMs: now,
    });
    return { ownerKey: args.ownerKey, ageBand: 'unknown' as const };
  },
});

/** Stores the age band chosen on the neutral age screen (§6, used for ad settings in Phase 7). */
export const setAgeBand = mutation({
  args: { installToken: v.string(), ageBand: ageBandValidator },
  returns: v.null(),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    await ctx.db.patch('installs', install._id, { ageBand: args.ageBand, lastSeenAtMs: Date.now() });
    return null;
  },
});

/** Keeps the install's locale in sync when the user changes language. */
export const setLocale = mutation({
  args: { installToken: v.string(), locale: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    await ctx.db.patch('installs', install._id, { locale: args.locale, lastSeenAtMs: Date.now() });
    return null;
  },
});
