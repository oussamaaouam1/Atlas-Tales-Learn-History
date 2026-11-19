import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { languages, storySchema, type Story } from './storySchema';
export function mediaPaths(story: Story): string[] {
  return ['cover.webp', ...story.images.map(i => `images/${i.id}.webp`),
    ...languages.flatMap(lang => story.pages.map(p => `audio/${lang}/${p.page}.m4a`))];
}
export async function validateStory(folder: string): Promise<Story> {
  const parsed = storySchema.safeParse(JSON.parse(await readFile(join(folder, 'story.json'), 'utf8')));
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n'));
  const missing: string[] = [];
  for (const file of mediaPaths(parsed.data)) {
    try { await access(join(folder, file)); } catch { missing.push(file); }
  }
  if (missing.length) throw new Error(missing.map(f => `Missing file: ${f}`).join('\n'));
  return parsed.data;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  validateStory(resolve(process.argv[2] ?? '')).then(s => console.log(`Valid: ${s.id} (${s.pages.length} pages, ${s.images.length} images)`)).catch(e => { console.error(e.message); process.exitCode = 1; });
}
