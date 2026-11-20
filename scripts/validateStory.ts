import { readFile, access } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { languages, storySchema, testStorySchema, type Story } from './storySchema';
export function mediaPaths(story: Story): string[] {
  return ['cover.webp', ...story.images.map(i => `images/${i.id}.webp`),
    ...languages.flatMap(lang => story.pages.map(p => `audio/${lang}/${p.page}.m4a`))];
}
/** Validates a story folder. `test` relaxes page/image counts for test- stories only. */
export async function validateStory(folder: string, options: { test?: boolean } = {}): Promise<Story> {
  const schema = options.test ? testStorySchema : storySchema;
  const parsed = schema.safeParse(JSON.parse(await readFile(join(folder, 'story.json'), 'utf8')));
  if (!parsed.success) throw new Error(parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('\n'));
  const missing: string[] = [];
  for (const file of mediaPaths(parsed.data)) {
    try { await access(join(folder, file)); } catch { missing.push(file); }
  }
  if (missing.length) throw new Error(missing.map(f => `Missing file: ${f}`).join('\n'));
  return parsed.data;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  validateStory(resolve(args.find((a) => !a.startsWith('--')) ?? ''), { test: args.includes('--test') }).then(s => console.log(`Valid: ${s.id} (${s.pages.length} pages, ${s.images.length} images)`)).catch(e => { console.error(e.message); process.exitCode = 1; });
}
