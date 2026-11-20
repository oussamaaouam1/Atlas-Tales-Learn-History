import { ConvexError, v } from 'convex/values';
import { mutation, env } from './_generated/server';
import { internal } from './_generated/api';
import { storyFields, pageFields, imageFields } from './contentValidators';
const { available: _available, ...inputStoryFields } = storyFields;
export const upsertStory = mutation({
  args: { adminKey: v.string(), story: v.object(inputStoryFields), pages: v.array(v.object(pageFields)), images: v.array(v.object(imageFields)) },
  returns: v.id('stories'),
  handler: async (ctx, args) => {
    if (!env.CONVEX_ADMIN_KEY || args.adminKey !== env.CONVEX_ADMIN_KEY) throw new ConvexError('Unauthorized admin');
    const { story, pages, images } = args;
    // STORY_SPEC counts for real stories; test- stories may be shorter (owner, BACKLOG #32).
    const isTest = story.slug.startsWith('test-');
    const [minPages, minImages] = isTest ? [12, 12] : [32, 40];
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(story.slug) || pages.length < minPages || pages.length > 40 || images.length < minImages || images.length > 60 || story.pageCount !== pages.length) throw new ConvexError('Invalid story counts or slug');
    if (!Number.isFinite(story.releaseAt) || !Number.isFinite(story.proEarlyAccessAt) || story.proEarlyAccessAt > story.releaseAt || story.durationSec <= 0) throw new ConvexError('Invalid release or duration');
    if (story.chapters.length !== 3 || story.quiz.length !== 3) throw new ConvexError('Expected three chapters and questions');
    story.quiz.forEach(q => { if (q.options.length < 3 || q.options.length > 4 || !Number.isInteger(q.answerIndex) || q.answerIndex < 0 || q.answerIndex >= q.options.length) throw new ConvexError('Invalid quiz'); });
    pages.forEach((p, i) => {
      if (p.page !== i + 1 || !images.some(im => im.page === p.page)) throw new ConvexError('Invalid page sequence or missing images');
      for (const audio of Object.values(p.audio)) if (!audio.url.startsWith('https://') || !Number.isFinite(audio.durationSec) || audio.durationSec <= 0) throw new ConvexError('Invalid audio');
    });
    const positions = new Set<string>();
    images.forEach(im => {
      const pos = `${im.page}:${im.order}`;
      if (!Number.isInteger(im.page) || im.page < 1 || im.page > pages.length || !Number.isInteger(im.order) || im.order < 1 || positions.has(pos) || !Number.isFinite(im.durationSec) || im.durationSec <= 0 || !im.url.startsWith('https://')) throw new ConvexError('Invalid image');
      positions.add(pos);
    });
    const existing = await ctx.db.query('stories').withIndex('by_slug', q => q.eq('slug', story.slug)).unique();
    const data = { ...story, available: story.status === 'published' && story.releaseAt <= Date.now() };
    const storyId = existing?._id ?? await ctx.db.insert('stories', data);
    if (existing) {
      await ctx.db.replace('stories', storyId, data);
      for (const table of ['storyPages', 'storyImages', 'releases'] as const) {
        const rows = table === 'storyPages'
          ? await ctx.db.query(table).withIndex('by_storyId_and_page', q => q.eq('storyId', storyId)).take(41)
          : table === 'storyImages'
            ? await ctx.db.query(table).withIndex('by_storyId_and_page_and_order', q => q.eq('storyId', storyId)).take(61)
            : await ctx.db.query(table).withIndex('by_storyId', q => q.eq('storyId', storyId)).take(2);
        for (const row of rows) await ctx.db.delete(row._id);
      }
    }
    for (const page of pages) await ctx.db.insert('storyPages', { storyId, ...page });
    for (const image of images) await ctx.db.insert('storyImages', { storyId, ...image });
    await ctx.db.insert('releases', { storyId, date: new Date(story.releaseAt).toISOString().slice(0, 10) });
    if (!data.available && story.status === 'published') await ctx.scheduler.runAt(story.releaseAt, internal.stories.release, { storyId });
    return storyId;
  },
});
