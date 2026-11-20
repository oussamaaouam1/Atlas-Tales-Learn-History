import { ConvexError, v } from 'convex/values';

import { mutation } from './_generated/server';
import { requireInstall } from './lib/installAuth';
import { requireReadableStory } from './lib/stories';

/**
 * Saves a finished quiz (§7.4). The score is computed on the server from the story's answer key;
 * the client only sends the chosen option per question. No penalty: just a score.
 */
export const saveResult = mutation({
  args: { installToken: v.string(), slug: v.string(), answers: v.array(v.number()) },
  returns: v.object({ score: v.number(), total: v.number() }),
  handler: async (ctx, args) => {
    const install = await requireInstall(ctx, args.installToken);
    const story = await requireReadableStory(ctx, args.slug);
    const total = story.quiz.length;
    if (args.answers.length !== total) throw new ConvexError('Wrong number of answers');
    const score = story.quiz.reduce((sum, q, i) => sum + (args.answers[i] === q.answerIndex ? 1 : 0), 0);
    await ctx.db.insert('quizResults', {
      ownerType: 'install',
      ownerKey: install.ownerKey,
      storyId: story._id,
      score,
      total,
      answeredAtMs: Date.now(),
    });
    return { score, total };
  },
});
