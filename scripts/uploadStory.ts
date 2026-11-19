import { readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { setDefaultResultOrder } from 'node:dns';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { parseFile } from 'music-metadata';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '../convex/_generated/api';
import { validateStory, mediaPaths } from './validateStory';
import { languages } from './storySchema';
setDefaultResultOrder('ipv4first');
function required(name: string) { const value = process.env[name]?.trim(); if (!value) throw new Error(`Missing ${name}`); return value; }
export async function uploadStory(folder: string, release?: string) {
  const story = await validateStory(folder);
  const releaseAt = release ? Date.parse(`${release}T00:00:00Z`) : Date.now();
  if (release && (!/^\d{4}-\d{2}-\d{2}$/.test(release) || !Number.isFinite(releaseAt) || new Date(releaseAt).toISOString().slice(0, 10) !== release)) throw new Error('Release must be a valid YYYY-MM-DD');
  const adminKey = required('CONVEX_ADMIN_KEY');
  const client = new ConvexHttpClient(required('EXPO_PUBLIC_CONVEX_URL'));
  const base = required('R2_PUBLIC_URL').replace(/\/$/, '');
  if (!base.startsWith('https://')) throw new Error('R2_PUBLIC_URL must use HTTPS');
  const bucket = required('R2_BUCKET_NAME');
  const s3 = new S3Client({ region: 'auto', endpoint: required('R2_ENDPOINT'), credentials: { accessKeyId: required('R2_ACCESS_KEY_ID'), secretAccessKey: required('R2_SECRET_ACCESS_KEY') } });
  const files = mediaPaths(story);
  // Content-addressed media prevents a failed re-upload from replacing live story media.
  const urls: Record<string, string> = {};
  const durations: Record<string, number> = {};
  for (const file of files) if (file.endsWith('.m4a')) {
    const duration = (await parseFile(join(folder, file))).format.duration;
    if (!duration || !Number.isFinite(duration)) throw new Error(`Unreadable audio duration: ${file}`);
    durations[file] = duration;
  }
  for (const file of files) {
    const body = await readFile(join(folder, file));
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 24);
    const key = `stories/${story.id}/${hash}/${file}`;
    await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentType: file.endsWith('.webp') ? 'image/webp' : 'audio/mp4', CacheControl: 'public, max-age=31536000, immutable' }));
    urls[file] = `${base}/${key}`;
  }
  const pages = story.pages.map(p => {
    const audio = (lang: typeof languages[number]) => ({ url: urls[`audio/${lang}/${p.page}.m4a`]!, durationSec: durations[`audio/${lang}/${p.page}.m4a`]! });
    return { page: p.page, chapter: p.chapter, text: p.text, tag: p.tag, speaker: p.speaker, audio: { ar: audio('ar'), fr: audio('fr'), es: audio('es'), en: audio('en') } };
  });
  const storyId = await client.mutation(api.admin.upsertStory, { adminKey, story: {
    slug: story.id, title: story.title, hook: story.hook, keyTakeaway: story.keyTakeaway, era: story.era, location: story.location,
    coverImageUrl: urls['cover.webp']!, chapters: story.chapters, didYouKnow: story.didYouKnow, quiz: story.quiz, sources: story.sources,
    durationSec: pages.reduce((sum, p) => sum + p.audio[story.masterLanguage].durationSec, 0), pageCount: pages.length,
    releaseAt, proEarlyAccessAt: releaseAt - 3 * 86400000, status: 'published',
  }, pages, images: story.images.map(im => ({ page: im.page, order: im.order, url: urls[`images/${im.id}.webp`]!, type: im.type, shot: im.shot, durationSec: im.durationSec })) });
  console.log(`Uploaded ${story.id}: ${storyId} (${pages.length} pages, ${story.images.length} images)`);
  return storyId;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  if (!args[0] || (args.length > 1 && (args[1] !== '--release' || !args[2] || args.length !== 3))) throw new Error('Usage: story:upload <folder> [--release YYYY-MM-DD]');
  uploadStory(resolve(args[0]), args[2]).catch(e => { console.error(e.message); process.exitCode = 1; });
}
