import { z } from 'zod';
export const languages = ['ar', 'fr', 'es', 'en'] as const;
const text = z.string().trim().min(1).max(10000);
const id = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(100);
export const localized = z.object({ ar: text, fr: text, es: text, en: text });
/** Page and image counts: STORY_SPEC rules for real stories; relaxed only for test- stories (owner, BACKLOG #32). */
export const STORY_LIMITS = { pages: [32, 40], images: [40, 60] } as const;
export const TEST_STORY_LIMITS = { pages: [12, 40], images: [12, 60] } as const;
type Limits = { pages: readonly [number, number]; images: readonly [number, number] };

export function makeStorySchema(limits: Limits) {
  return z.object({
  id, version: z.literal(2), title: localized, hook: localized, keyTakeaway: localized,
  era: z.object({ period: text, yearStart: z.number().int(), yearEnd: z.number().int(), region: text }),
  location: z.object({ name: text, lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) }),
  masterLanguage: z.enum(languages), accuracyMode: z.enum(['strict', 'dramatized']),
  names: z.array(localized.extend({ id })),
  characters: z.record(id, z.object({ role: text, appearance: text, personality: text,
    age: z.string().optional(), isReligiousFigure: z.boolean().optional(), depict: z.boolean().optional() })),
  settings: z.array(z.object({ id, name: text, description: text })).min(1),
  chapters: z.array(z.object({ number: z.number().int(), firstPage: z.number().int(), title: localized })).length(3),
  pages: z.array(z.object({ page: z.number().int(), chapter: z.number().int(),
    beat: z.enum(['cold-open','rewind','world','ambition','cliffhanger','obstacle-1','obstacle-2','darkest','turning-point','outcome','what-next','today','closing-echo']),
    year: z.string(), settingId: id, tag: z.enum(['fact','disputed','legend','imagined']),
    speaker: z.enum(['narrator','guide']), text: localized, historicalNote: z.string(), images: z.array(id).min(1),
  })).min(limits.pages[0]).max(limits.pages[1]),
  images: z.array(z.object({ id, page: z.number().int(), order: z.number().int().positive(),
    type: z.enum(['scene','plate','cutout','detail','map']), shot: z.enum(['wide','medium','close','detail']),
    durationSec: z.number().positive().max(3600), prompt: text,
  })).min(limits.images[0]).max(limits.images[1]),
  didYouKnow: localized,
  quiz: z.array(z.object({ question: localized, options: z.array(localized).min(3).max(4), answerIndex: z.number().int().min(0) })).length(3),
  sources: z.array(z.object({ title: text, url: z.url().regex(/^https?:\/\//) })).min(1),
}).superRefine((s, ctx) => {
  const fail = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message });
  if (s.era.yearEnd < s.era.yearStart) fail(['era'], 'yearEnd must not precede yearStart');
  for (const key of ['images','settings','names'] as const) {
    if (new Set(s[key].map(x => x.id)).size !== s[key].length) fail([key], 'IDs must be unique');
  }
  s.chapters.forEach((c, i) => {
    if (c.number !== i + 1 || c.firstPage < 1 || c.firstPage > s.pages.length ||
      (i === 0 ? c.firstPage !== 1 : c.firstPage <= s.chapters[i - 1]!.firstPage)) fail(['chapters', i], 'Chapters must be numbered 1-3 with increasing start pages, starting at page 1');
  });
  s.pages.forEach((p, i) => {
    if (p.page !== i + 1) fail(['pages', i, 'page'], 'Pages must be sequential starting at 1');
    const chapter = s.chapters.filter(c => c.firstPage <= p.page).at(-1);
    if (p.chapter !== chapter?.number) fail(['pages', i, 'chapter'], 'Chapter does not match chapter boundaries');
    if (!s.settings.some(x => x.id === p.settingId)) fail(['pages', i, 'settingId'], 'Unknown setting');
    if (new Set(p.images).size !== p.images.length) fail(['pages', i, 'images'], 'Duplicate image reference');
    p.images.forEach((ref, j) => {
      const image = s.images.find(x => x.id === ref);
      if (!image || image.page !== p.page || image.order !== j + 1) fail(['pages', i, 'images', j], 'Image missing or page/order mismatch');
    });
  });
  s.images.forEach((im, i) => {
    if (!s.pages.find(p => p.page === im.page)?.images.includes(im.id)) fail(['images', i], 'Image must be referenced by its page');
  });
  s.quiz.forEach((q, i) => { if (q.answerIndex >= q.options.length) fail(['quiz', i, 'answerIndex'], 'Answer index outside options'); });
  });
}

export const storySchema = makeStorySchema(STORY_LIMITS);
export const testStorySchema = makeStorySchema(TEST_STORY_LIMITS).refine((s) => s.id.startsWith('test-'), { message: 'Test mode is only for story ids that start with test-', path: ['id'] });
export type Story = z.infer<typeof storySchema>;
