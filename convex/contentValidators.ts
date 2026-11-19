import { v } from 'convex/values';
export const localized = v.object({ ar: v.string(), fr: v.string(), es: v.string(), en: v.string() });
export const storyFields = {
  slug: v.string(), title: localized, hook: localized, keyTakeaway: localized,
  era: v.object({ period: v.string(), yearStart: v.number(), yearEnd: v.number(), region: v.string() }),
  location: v.object({ name: v.string(), lat: v.number(), lng: v.number() }),
  coverImageUrl: v.string(), chapters: v.array(v.object({ number: v.number(), firstPage: v.number(), title: localized })),
  didYouKnow: localized, quiz: v.array(v.object({ question: localized, options: v.array(localized), answerIndex: v.number() })),
  sources: v.array(v.object({ title: v.string(), url: v.string() })),
  durationSec: v.number(), pageCount: v.number(), releaseAt: v.number(), proEarlyAccessAt: v.number(),
  status: v.union(v.literal('draft'), v.literal('published')),
  // Scheduled mutations materialize release state; client time never grants access.
  available: v.boolean(),
};
const audioFile = v.object({ url: v.string(), durationSec: v.number() });
export const pageFields = {
  page: v.number(), chapter: v.number(), text: localized,
  audio: v.object({ ar: audioFile, fr: audioFile, es: audioFile, en: audioFile }),
  tag: v.union(v.literal('fact'), v.literal('disputed'), v.literal('legend'), v.literal('imagined')),
  speaker: v.union(v.literal('narrator'), v.literal('guide')),
};
export const imageFields = {
  page: v.number(), order: v.number(), url: v.string(), durationSec: v.number(),
  type: v.union(v.literal('scene'), v.literal('plate'), v.literal('cutout'), v.literal('detail'), v.literal('map')),
  shot: v.union(v.literal('wide'), v.literal('medium'), v.literal('close'), v.literal('detail')),
};
