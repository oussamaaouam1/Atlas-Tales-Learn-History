import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { describe, expect, test } from 'vitest';
import { fixtureStory } from './fixtureStory';
import { mediaPaths, validateStory } from './validateStory';
test('lists missing media, then accepts a complete folder', async () => {
  const folder = await mkdtemp(join(tmpdir(), 'atlas-validator-'));
  try {
    const story = fixtureStory('placeholder-files');
    await writeFile(join(folder, 'story.json'), JSON.stringify(story));
    await expect(validateStory(folder)).rejects.toThrow('Missing file: cover.webp');
    for (const file of mediaPaths(story)) {
      await mkdir(dirname(join(folder, file)), { recursive: true });
      await writeFile(join(folder, file), 'file-existence-test');
    }
    expect((await validateStory(folder)).id).toBe(story.id);
  } finally { await rm(folder, { recursive: true, force: true }); }
});

import { STORY_LIMITS, storySchema, testStorySchema } from './storySchema';

describe('test-story mode', () => {
  function short(id: string) {
    const s = fixtureStory(id);
    // 18 pages in three chapters of six (pages 1, 7, 13).
    const pages = s.pages.slice(0, 18).map((p) => ({ ...p, chapter: p.page < 7 ? 1 : p.page < 13 ? 2 : 3 }));
    const chapters = s.chapters.map((c, i) => ({ ...c, firstPage: [1, 7, 13][i]! }));
    const keep = new Set(pages.flatMap((p) => p.images));
    return { ...s, id, pages, chapters, images: s.images.filter((i) => keep.has(i.id)) };
  }

  test('real stories keep the STORY_SPEC limits', () => {
    expect(STORY_LIMITS.pages).toEqual([32, 40]);
    expect(storySchema.safeParse(short('test-short')).success).toBe(false);
  });

  test('a short test- story passes in test mode', () => {
    const result = testStorySchema.safeParse(short('test-short'));
    expect(result.success).toBe(true);
  });

  test('test mode refuses stories whose id does not start with test-', () => {
    expect(testStorySchema.safeParse(short('real-story')).success).toBe(false);
  });
});
