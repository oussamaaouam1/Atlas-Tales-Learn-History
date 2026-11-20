/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { afterEach, describe, expect, test, vi } from 'vitest';

import { fixtureStory } from '../scripts/fixtureStory';
import { api } from './_generated/api';
import schema from './schema';

const modules = import.meta.glob('./**/*.ts');
const OWNER = 'install_123e4567-e89b-42d3-a456-426614174000';
const TOKEN = 'a'.repeat(64);
const OTHER = 'b'.repeat(64);

function upload(releaseAt = 0) {
  const s = fixtureStory('reader-test');
  const audio = { url: 'https://example.com/a.m4a', durationSec: 2 };
  return {
    adminKey: 'test-admin',
    story: {
      slug: s.id, title: s.title, hook: s.hook, keyTakeaway: s.keyTakeaway, era: s.era, location: s.location,
      coverImageUrl: 'https://example.com/c.webp', chapters: s.chapters, didYouKnow: s.didYouKnow, quiz: s.quiz, sources: s.sources,
      durationSec: 64, pageCount: 32, releaseAt, proEarlyAccessAt: releaseAt - 259200000, status: 'published' as const,
    },
    pages: s.pages.map((p) => ({ page: p.page, chapter: p.chapter, text: p.text, tag: p.tag, speaker: p.speaker, audio: { ar: audio, fr: audio, es: audio, en: audio } })),
    images: s.images.map((i) => ({ page: i.page, order: i.order, type: i.type, shot: i.shot, durationSec: i.durationSec, url: 'https://example.com/i.webp' })),
  };
}

async function setup(releaseAt = 0) {
  vi.stubEnv('CONVEX_ADMIN_KEY', 'test-admin');
  const t = convexTest(schema, modules);
  await t.mutation(api.admin.upsertStory, upload(releaseAt));
  await t.mutation(api.installs.register, { ownerKey: OWNER, installToken: TOKEN, platform: 'android', appVersion: '0.1.0', locale: 'en' });
  return t;
}
const args = { installToken: TOKEN, slug: 'reader-test' };

afterEach(() => vi.unstubAllEnvs());

describe('reading progress', () => {
  test('a story never opened has no progress', async () => {
    const t = await setup();
    expect(await t.query(api.progress.get, args)).toBeNull();
  });

  test('saves the page and its chapter, and resumes there', async () => {
    const t = await setup();
    await t.mutation(api.progress.save, { ...args, page: 14 });
    expect(await t.query(api.progress.get, args)).toEqual({ currentPage: 14, currentChapter: 2, maxPageReached: 14, completed: false });
  });

  test('going back keeps the furthest page reached, and one row per story', async () => {
    const t = await setup();
    await t.mutation(api.progress.save, { ...args, page: 20 });
    await t.mutation(api.progress.save, { ...args, page: 5 });
    expect(await t.query(api.progress.get, args)).toMatchObject({ currentPage: 5, currentChapter: 1, maxPageReached: 20 });
    expect(await t.run((ctx) => ctx.db.query('storyProgress').take(5))).toHaveLength(1);
  });

  test('rejects pages outside the story', async () => {
    const t = await setup();
    await expect(t.mutation(api.progress.save, { ...args, page: 0 })).rejects.toThrow(/out of range/);
    await expect(t.mutation(api.progress.save, { ...args, page: 33 })).rejects.toThrow(/out of range/);
  });

  test('completing is idempotent and marks the whole story reached', async () => {
    const t = await setup();
    await t.mutation(api.progress.save, { ...args, page: 3 });
    await t.mutation(api.progress.complete, args);
    await t.mutation(api.progress.complete, args);
    expect(await t.query(api.progress.get, args)).toMatchObject({ maxPageReached: 32, completed: true });
  });

  test('unknown installs and unreleased stories are refused', async () => {
    const t = await setup(Date.now() + 86_400_000);
    await expect(t.mutation(api.progress.save, { ...args, page: 1 })).rejects.toThrow(/not available/);
    const t2 = await setup();
    await expect(t2.mutation(api.progress.save, { installToken: OTHER, slug: 'reader-test', page: 1 })).rejects.toThrow(/Unknown install/);
  });
});

describe('quiz results', () => {
  test('the server scores the answers from the answer key', async () => {
    const t = await setup();
    // fixture answer key: [0, 0, 0]
    expect(await t.mutation(api.quiz.saveResult, { ...args, answers: [0, 2, 0] })).toEqual({ score: 2, total: 3 });
    const rows = await t.run((ctx) => ctx.db.query('quizResults').take(5));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ score: 2, total: 3, ownerKey: OWNER });
  });

  test('rejects an incomplete set of answers', async () => {
    const t = await setup();
    await expect(t.mutation(api.quiz.saveResult, { ...args, answers: [0] })).rejects.toThrow(/Wrong number/);
  });
});
