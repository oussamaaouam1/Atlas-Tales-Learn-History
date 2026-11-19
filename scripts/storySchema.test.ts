import { describe, expect, test } from 'vitest';
import { storySchema } from './storySchema';
import { fixtureStory } from './fixtureStory';
describe('story validator', () => {
  test('accepts a complete fixture', () => expect(storySchema.safeParse(fixtureStory('placeholder-one')).success).toBe(true));
  test.each(['language', 'pages', 'duration', 'quiz', 'location', 'duplicate', 'reference', 'chapter', 'path'])('rejects invalid %s', kind => {
    const s = fixtureStory('placeholder-one');
    if (kind === 'language') s.title.ar = '';
    if (kind === 'pages') s.pages.pop();
    if (kind === 'duration') s.images[0]!.durationSec = 0;
    if (kind === 'quiz') s.quiz[0]!.answerIndex = 4;
    if (kind === 'location') s.location.lat = 91;
    if (kind === 'duplicate') s.images[1]!.id = s.images[0]!.id;
    if (kind === 'reference') s.pages[0]!.images = ['missing'];
    if (kind === 'chapter') s.chapters[1]!.firstPage = 1;
    if (kind === 'path') s.id = '../escape';
    expect(storySchema.safeParse(s).success).toBe(false);
  });
});
