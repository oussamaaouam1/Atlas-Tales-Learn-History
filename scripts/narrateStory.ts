/**
 * Story narration with Gemini TTS (owner, BACKLOG #32): one request per page per language,
 * WAV → mono AAC/M4A (STORY_SPEC §10: audio/<lang>/<page>.m4a). Free-tier friendly: paced requests,
 * retries on 429 using the server's retry delay, skips files already made, and stops cleanly on a
 * daily quota so a later run resumes.
 *
 * Usage: pnpm story:narrate <folder> [--lang en,fr] [--pages 1-6] [--delay 7000] [--timings-only]
 * Env (.env.local): GEMINI_API_KEY; optional GEMINI_TTS_MODEL, FFMPEG (path to ffmpeg).
 */
import { execFile } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { parseFile } from 'music-metadata';

import { languages, type Story } from './storySchema';

const run = promisify(execFile);
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/interactions';
export const DEFAULT_MODEL = 'gemini-3.8-flash-tts';

/** Voices from the Gemini TTS voice list: Sulafat "Warm" for the narrator, Achird "Friendly" for the guide. */
export const VOICES = { narrator: 'Sulafat', guide: 'Achird' } as const;
/** Short style notes (the docs warn long director's notes cause voice drift). */
export const STYLES = {
  narrator: 'warm, gentle storyteller for children, unhurried, full of wonder',
  guide: 'friendly, playful guide smiling while talking to a child',
} as const;

type Speaker = keyof typeof VOICES;
type Lang = (typeof languages)[number];

export function ttsRequest(text: string, speaker: Speaker, model = DEFAULT_MODEL) {
  return {
    model,
    input: [{ type: 'user_input', content: [{ type: 'text', text, annotations: [{ type: 'speech_metadata', style: STYLES[speaker] }] }] }],
    response_format: { type: 'audio' },
    generation_config: { speech_config: [{ voice: VOICES[speaker] }] },
  };
}

interface InteractionResponse {
  steps?: { type?: string; content?: { type?: string; data?: string }[] }[];
}

/** Base64 audio from an Interactions response: the last audio item of the model_output step. */
export function audioFromResponse(json: InteractionResponse): string | null {
  const items = (json.steps ?? [])
    .filter((s) => s.type === 'model_output')
    .flatMap((s) => s.content ?? [])
    .filter((c) => c.type === 'audio' && typeof c.data === 'string');
  return items.at(-1)?.data ?? null;
}

/** Seconds to wait from a 429 body (RetryInfo "30s") or Retry-After header; null if absent. */
export function retryDelaySeconds(body: string, retryAfter: string | null): number | null {
  if (retryAfter && Number.isFinite(Number(retryAfter))) return Number(retryAfter);
  const match = /"retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/.exec(body);
  return match ? Number(match[1]) : null;
}

/** True when the error is a daily quota (stop for today) rather than a per-minute limit. */
export function isDailyQuota(body: string): boolean {
  return /PerDay|per day|daily/i.test(body);
}

/** Silent test placeholders (~1.5 KB) count as missing, so a later run replaces them with narration. */
export const PLACEHOLDER_MAX_BYTES = 5000;
export function hasNarration(file: string): boolean {
  return existsSync(file) && statSync(file).size > PLACEHOLDER_MAX_BYTES;
}

/** Splits a page's narration evenly across its images (image durationSec, STORY_SPEC §8). */
export function splitDuration(totalSec: number, imageCount: number): number[] {
  if (imageCount <= 0) return [];
  const each = Math.max(0.5, Math.round((totalSec / imageCount) * 10) / 10);
  return Array.from({ length: imageCount }, () => each);
}

function parsePages(arg: string | undefined, count: number): number[] {
  if (!arg) return Array.from({ length: count }, (_, i) => i + 1);
  const [a, b] = arg.split('-').map(Number);
  const from = a ?? 1;
  const to = b ?? from;
  return Array.from({ length: to - from + 1 }, (_, i) => from + i).filter((p) => p >= 1 && p <= count);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function synthesize(text: string, speaker: Speaker, key: string, model: string): Promise<Buffer | 'daily-quota'> {
  for (let attempt = 1; attempt <= 8; attempt++) {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
      body: JSON.stringify(ttsRequest(text, speaker, model)),
    });
    const body = await res.text();
    if (res.ok) {
      const data = audioFromResponse(JSON.parse(body) as InteractionResponse);
      if (!data) throw new Error(`No audio in response: ${body.slice(0, 300)}`);
      return Buffer.from(data, 'base64');
    }
    if (res.status === 429 || res.status >= 500) {
      if (res.status === 429 && isDailyQuota(body)) return 'daily-quota';
      const wait = retryDelaySeconds(body, res.headers.get('retry-after')) ?? Math.min(300, 10 * 2 ** attempt);
      console.log(`  ${res.status}: waiting ${Math.ceil(wait)} s (attempt ${attempt}/8)`);
      await sleep(Math.ceil(wait * 1000) + 500);
      continue;
    }
    throw new Error(`TTS failed (${res.status}): ${body.slice(0, 400)}`);
  }
  throw new Error('TTS kept failing after 8 attempts');
}

async function updateTimings(folder: string, story: Story) {
  for (const page of story.pages) {
    const file = join(folder, 'audio', 'en', `${page.page}.m4a`);
    if (!hasNarration(file)) continue;
    const duration = (await parseFile(file)).format.duration ?? 0;
    const parts = splitDuration(duration, page.images.length);
    page.images.forEach((id, i) => {
      const image = story.images.find((im) => im.id === id);
      if (image) image.durationSec = parts[i] ?? image.durationSec;
    });
  }
  await writeFile(join(folder, 'story.json'), JSON.stringify(story, null, 2) + '\n');
  console.log('Image timings updated from English narration.');
}

export async function narrateStory(folder: string, opts: { langs: Lang[]; pages?: string; delayMs: number; timingsOnly: boolean }) {
  const story = JSON.parse(await readFile(join(folder, 'story.json'), 'utf8')) as Story;
  if (opts.timingsOnly) return updateTimings(folder, story);
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) throw new Error('Missing GEMINI_API_KEY in .env.local');
  const model = process.env.GEMINI_TTS_MODEL?.trim() || DEFAULT_MODEL;
  const ffmpeg = process.env.FFMPEG?.trim() || 'ffmpeg';
  const pages = parsePages(opts.pages, story.pages.length);
  let made = 0;
  let skipped = 0;

  for (const lang of opts.langs) {
    await mkdir(join(folder, 'audio', lang), { recursive: true });
    await mkdir(join(folder, '_wav', lang), { recursive: true });
    for (const n of pages) {
      const page = story.pages[n - 1]!;
      const out = join(folder, 'audio', lang, `${n}.m4a`);
      if (hasNarration(out)) {
        skipped++;
        continue;
      }
      console.log(`${lang} page ${n} (${page.speaker})…`);
      const wav = await synthesize(page.text[lang], page.speaker, key, model);
      if (wav === 'daily-quota') {
        console.log(`Daily quota reached. Made ${made}, skipped ${skipped}. Run again later to continue.`);
        return;
      }
      const wavPath = join(folder, '_wav', lang, `${n}.wav`);
      await writeFile(wavPath, wav);
      await run(ffmpeg, ['-v', 'error', '-y', '-i', wavPath, '-ac', '1', '-c:a', 'aac', '-b:a', '80k', out]);
      await rm(wavPath);
      made++;
      await sleep(opts.delayMs);
    }
  }
  console.log(`Done: made ${made}, skipped ${skipped}.`);
  if (opts.langs.includes('en')) await updateTimings(folder, story);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const args = process.argv.slice(2);
  const value = (flag: string) => {
    const i = args.indexOf(flag);
    return i >= 0 ? args[i + 1] : undefined;
  };
  const folder = args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--'));
  if (!folder) throw new Error('Usage: story:narrate <folder> [--lang en,fr] [--pages 1-6] [--delay 7000] [--timings-only]');
  const langs = (value('--lang')?.split(',') ?? [...languages]).filter((l): l is Lang => (languages as readonly string[]).includes(l));
  narrateStory(resolve(folder), {
    langs,
    pages: value('--pages'),
    delayMs: Number(value('--delay') ?? 7000),
    timingsOnly: args.includes('--timings-only'),
  }).catch((e: unknown) => {
    console.error(e instanceof Error ? e.message : e);
    process.exitCode = 1;
  });
}
