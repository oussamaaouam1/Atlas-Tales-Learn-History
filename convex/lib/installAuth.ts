import { ConvexError } from 'convex/values';

import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

const OWNER_KEY_PATTERN = /^install_[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const INSTALL_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export function assertValidOwnerKey(ownerKey: string): void {
  if (!OWNER_KEY_PATTERN.test(ownerKey)) throw new ConvexError('Invalid install owner key');
}

export function assertValidInstallToken(token: string): void {
  if (!INSTALL_TOKEN_PATTERN.test(token)) throw new ConvexError('Invalid install token');
}

/** SHA-256 hex of the install token. */
export async function hashInstallToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Resolves the calling install from its secret token, or throws. Identity is never taken from a client-supplied key. */
export async function requireInstall(
  ctx: QueryCtx | MutationCtx,
  installToken: string,
): Promise<Doc<'installs'>> {
  assertValidInstallToken(installToken);
  const installTokenHash = await hashInstallToken(installToken);
  const install = await ctx.db
    .query('installs')
    .withIndex('by_installTokenHash', (q) => q.eq('installTokenHash', installTokenHash))
    .unique();
  if (!install) throw new ConvexError('Unknown install');
  return install;
}
