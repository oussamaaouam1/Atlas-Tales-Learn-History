import { ConvexError } from 'convex/values';

import type { Doc } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

/** A story readers may access: published and released. Throws otherwise. */
export async function requireReadableStory(ctx: QueryCtx | MutationCtx, slug: string): Promise<Doc<'stories'>> {
  const story = await ctx.db
    .query('stories')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique();
  if (!story || story.status !== 'published' || !story.available) throw new ConvexError('Story not available');
  return story;
}

/** Chapter number for a page, from the story's chapter list (chapters sorted by firstPage). */
export function chapterForPage(chapters: readonly { number: number; firstPage: number }[], page: number): number {
  let chapter = chapters[0]?.number ?? 1;
  for (const c of [...chapters].sort((a, b) => a.firstPage - b.firstPage)) {
    if (page >= c.firstPage) chapter = c.number;
  }
  return chapter;
}
