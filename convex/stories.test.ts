/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { api, internal } from './_generated/api';
import schema from './schema';
import { fixtureStory } from '../scripts/fixtureStory';
const modules = import.meta.glob('./**/*.ts');
function payload(releaseAt = 0) {
  const s = fixtureStory('placeholder-test');
  const audio = { url: 'https://example.com/audio.m4a', durationSec: 2 };
  return { adminKey: 'test-admin', story: {
    slug: s.id, title: s.title, hook: s.hook, keyTakeaway: s.keyTakeaway, era: s.era, location: s.location,
    coverImageUrl: 'https://example.com/cover.webp', chapters: s.chapters, didYouKnow: s.didYouKnow, quiz: s.quiz, sources: s.sources,
    durationSec: 64, pageCount: 32, releaseAt, proEarlyAccessAt: releaseAt - 259200000, status: 'published' as const,
  }, pages: s.pages.map(p => ({ page: p.page, chapter: p.chapter, text: p.text, tag: p.tag, speaker: p.speaker, audio: { ar: audio, fr: audio, es: audio, en: audio } })),
  images: s.images.map(i => ({ page: i.page, order: i.order, type: i.type, shot: i.shot, durationSec: i.durationSec, url: 'https://example.com/image.webp' })) };
}
afterEach(() => vi.unstubAllEnvs());
describe('content access and uploads', () => {
  test('rejects missing and incorrect admin credentials', async () => {
    vi.stubEnv('CONVEX_ADMIN_KEY', 'test-admin');
    const t = convexTest(schema, modules);
    await expect(t.mutation(api.admin.upsertStory, { ...payload(), adminKey: 'wrong' })).rejects.toThrow('Unauthorized');
    expect(await t.query(api.stories.getStory, { slug: 'placeholder-test' })).toBeNull();
  });
  test('re-upload keeps one complete story and replaces children atomically', async () => {
    vi.stubEnv('CONVEX_ADMIN_KEY', 'test-admin');
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.admin.upsertStory, payload());
    expect(await t.mutation(api.admin.upsertStory, payload())).toBe(id);
    const result = await t.query(api.stories.getStory, { slug: 'placeholder-test' });
    expect(result?.pages).toHaveLength(32);
    expect(result?.images).toHaveLength(40);
    expect(await t.run(ctx => ctx.db.query('releases').take(10))).toHaveLength(1);
    const invalid = payload(); invalid.pages.pop();
    await expect(t.mutation(api.admin.upsertStory, invalid)).rejects.toThrow();
    expect((await t.query(api.stories.getStory, { slug: 'placeholder-test' }))?.pages).toHaveLength(32);
  });
  test('future and draft stories are hidden; stale release jobs cannot unlock rescheduled stories', async () => {
    vi.stubEnv('CONVEX_ADMIN_KEY', 'test-admin');
    const t = convexTest(schema, modules);
    const id = await t.mutation(api.admin.upsertStory, payload(Date.now() + 86400000));
    await t.mutation(internal.stories.release, { storyId: id });
    expect(await t.query(api.stories.getStory, { slug: 'placeholder-test' })).toBeNull();
    expect((await t.query(api.stories.listForMap, { paginationOpts: { numItems: 10, cursor: null } })).page).toHaveLength(0);
    await t.mutation(api.admin.upsertStory, { ...payload(), story: { ...payload().story, status: 'draft' } });
    expect(await t.query(api.stories.getStory, { slug: 'placeholder-test' })).toBeNull();
    await t.mutation(api.admin.upsertStory, payload());
    expect((await t.query(api.stories.listForMap, { paginationOpts: { numItems: 10, cursor: null } })).page).toHaveLength(1);
  });
});
