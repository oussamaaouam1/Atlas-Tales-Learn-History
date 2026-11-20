import { ConvexError, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { requireInstall } from './lib/installAuth';
import { chapterForPage, requireReadableStory } from './lib/stories';

const progressValidator = v.object({
  currentPage: v.number(),
  currentChapter: v.number(),
  maxPageReached: v.number(),
  completed: v.boolean(),
});

/** Where this install stopped in a story (resume, §7.2), or null if never opened. */
export const get = query({
  args: { installToken: v.string(), slug: v.string() },
  returns: v.union(v.null(), progressValidator),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    const story = await requireReadableStory(ctx, args.slug);
    const row = await ctx.db
      .query('storyProgress')
      .withIndex('by_ownerKey_and_storyId', (q) => q.eq('ownerKey', install.ownerKey).eq('storyId', story._id))
      .unique();
    if (!row) return null;
    return {
      currentPage: row.currentPage,
      currentChapter: row.currentChapter,
      maxPageReached: row.maxPageReached,
      completed: row.completedAtMs !== undefined,
    };
  },
});

/** Saves the current page (called at each page, §7.2). maxPageReached never goes backwards. */
export const save = mutation({
  args: { installToken: v.string(), slug: v.string(), page: v.number() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    const story = await requireReadableStory(ctx, args.slug);
    if (!Number.isInteger(args.page) || args.page < 1 || args.page > story.pageCount) {
      throw new ConvexError('Page out of range');
    }
    const chapter = chapterForPage(story.chapters, args.page);
    const now = Date.now();
    const row = await ctx.db
      .query('storyProgress')
      .withIndex('by_ownerKey_and_storyId', (q) => q.eq('ownerKey', install.ownerKey).eq('storyId', story._id))
      .unique();
    if (row) {
      await ctx.db.patch('storyProgress', row._id, {
        currentPage: args.page,
        currentChapter: chapter,
        maxPageReached: Math.max(row.maxPageReached, args.page),
        updatedAtMs: now,
      });
    } else {
      await ctx.db.insert('storyProgress', {
        ownerType: 'install',
        ownerKey: install.ownerKey,
        storyId: story._id,
        currentPage: args.page,
        currentChapter: chapter,
        maxPageReached: args.page,
        updatedAtMs: now,
      });
    }
    return null;
  },
});

/** Marks the story finished (after the last page). Idempotent; stamps are added here in Phase 6. */
export const complete = mutation({
  args: { installToken: v.string(), slug: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    const story = await requireReadableStory(ctx, args.slug);
    const now = Date.now();
    const last = story.pageCount;
    const row = await ctx.db
      .query('storyProgress')
      .withIndex('by_ownerKey_and_storyId', (q) => q.eq('ownerKey', install.ownerKey).eq('storyId', story._id))
      .unique();
    const lastChapter = chapterForPage(story.chapters, last);
    if (!row) {
      await ctx.db.insert('storyProgress', {
        ownerType: 'install',
        ownerKey: install.ownerKey,
        storyId: story._id,
        currentPage: last,
        currentChapter: lastChapter,
        maxPageReached: last,
        completedAtMs: now,
        updatedAtMs: now,
      });
    } else if (row.completedAtMs === undefined) {
      await ctx.db.patch('storyProgress', row._id, { maxPageReached: last, completedAtMs: now, updatedAtMs: now });
    }
    return null;
  },
});
