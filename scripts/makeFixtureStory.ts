import { readFile, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import sharp from 'sharp';
import { fixtureStory } from './fixtureStory';
import { languages, storySchema } from './storySchema';
export async function makeFixtureStory(slug: string) {
  const story = storySchema.parse(fixtureStory(slug));
  const folder = resolve('content', slug);
  // Require the bundled silent audio before writing anything.
  const silence = fileURLToPath(new URL('./fixtures/placeholder-silence.m4a', import.meta.url));
  await readFile(silence);
  await mkdir(join(folder, 'images'), { recursive: true });
  const image = await sharp({ create: { width: 1280, height: 720, channels: 3, background: '#1C5BD9' } }).webp().toBuffer();
  await writeFile(join(folder, 'cover.webp'), image);
  for (const im of story.images) await writeFile(join(folder, 'images', `${im.id}.webp`), image);
  for (const lang of languages) for (const page of story.pages) {
    const target = join(folder, 'audio', lang, `${page.page}.m4a`);
    await mkdir(dirname(target), { recursive: true });
    await copyFile(silence, target);
  }
  await writeFile(join(folder, 'story.json'), JSON.stringify(story, null, 2) + '\n');
  return folder;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  makeFixtureStory(process.argv[2] ?? '').then(console.log).catch(e => { console.error(e.message); process.exitCode = 1; });
}
