import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { expect, test } from 'vitest';
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
