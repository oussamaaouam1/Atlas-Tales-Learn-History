import { paginationOptsValidator, paginationResultValidator } from 'convex/server';
import { v } from 'convex/values';
import { query, internalMutation } from './_generated/server';
import schema from './schema';

export const listForMap = query({
  args: { paginationOpts: paginationOptsValidator },
  returns: paginationResultValidator(schema.doc('stories')),
  handler: (ctx, args) => ctx.db.query('stories').withIndex('by_status_and_available', q => q.eq('status', 'published').eq('available', true)).paginate(args.paginationOpts),
});
export const getStory = query({
  args: { slug: v.string() },
  returns: v.union(v.null(), v.object({ story: schema.doc('stories'), pages: v.array(schema.doc('storyPages')), images: v.array(schema.doc('storyImages')) })),
  handler: async (ctx, { slug }) => {
    const story = await ctx.db.query('stories').withIndex('by_slug', q => q.eq('slug', slug)).unique();
    if (!story || story.status !== 'published' || !story.available) return null;
    const pages = await ctx.db.query('storyPages').withIndex('by_storyId_and_page', q => q.eq('storyId', story._id)).take(40);
    const images = await ctx.db.query('storyImages').withIndex('by_storyId_and_page_and_order', q => q.eq('storyId', story._id)).take(60);
    return { story, pages, images };
  },
});
export const release = internalMutation({
  args: { storyId: v.id('stories') }, returns: v.null(),
  handler: async (ctx, { storyId }) => {
    const story = await ctx.db.get('stories', storyId);
    if (story && story.status === 'published' && story.releaseAt <= Date.now()) await ctx.db.patch('stories', storyId, { available: true });
    return null;
  },
});
