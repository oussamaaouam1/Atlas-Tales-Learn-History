/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, test } from 'vitest';

import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');

const OWNER = 'install_123e4567-e89b-42d3-a456-426614174000';
const TOKEN = 'a'.repeat(64);
const OTHER_TOKEN = 'b'.repeat(64);
const base = { platform: 'android' as const, appVersion: '0.1.0', locale: 'en' };

async function allInstalls(t: ReturnType<typeof convexTest>) {
  return t.run((ctx) => ctx.db.query('installs').take(10));
}

describe('installs.register', () => {
  test('creates exactly one row with ageBand unknown and stores only a hash of the token', async () => {
    const t = convexTest(schema, modules);
    const result = await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, ...base });
    expect(result).toEqual({ ownerKey: OWNER, ageBand: 'unknown' });

    const rows = await allInstalls(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.installTokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(rows[0]?.installTokenHash).not.toBe(TOKEN);
  });

  test('is idempotent: a second launch updates the same row', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, ...base });
    await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, ...base, locale: 'ar', appVersion: '0.2.0' });

    const rows = await allInstalls(t);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ locale: 'ar', appVersion: '0.2.0' });
  });

  test('refuses an existing ownerKey with a different token', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, ...base });
    await expect(
      t.mutation(api.installs.register, { ownerKey: OWNER, installToken: OTHER_TOKEN, ...base }),
    ).rejects.toThrow(/does not match/);
  });

  test('rejects malformed owner keys and tokens', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.installs.register, { ownerKey: 'user_1', installToken: TOKEN, ...base }),
    ).rejects.toThrow(/owner key/);
    await expect(
      t.mutation(api.installs.register, { ownerKey: OWNER, installToken: 'short', ...base }),
    ).rejects.toThrow(/install token/);
  });
});

describe('installs.setAgeBand / setLocale', () => {
  test('updates the install identified by its token', async () => {
    const t = convexTest(schema, modules);
    await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, ...base });
    await t.mutation(api.installs.setAgeBand, { installToken: TOKEN, ageBand: 'child' });
    await t.mutation(api.installs.setLocale, { installToken: TOKEN, locale: 'fr' });
    const [row] = await allInstalls(t);
    expect(row).toMatchObject({ ageBand: 'child', locale: 'fr' });
  });

  test('refuses an unknown token', async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.mutation(api.installs.setAgeBand, { installToken: OTHER_TOKEN, ageBand: 'adult' }),
    ).rejects.toThrow(/Unknown install/);
  });
});
