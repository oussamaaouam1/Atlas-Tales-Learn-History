import {
  afterPage,
  chapterMarks,
  chapterMinutes,
  chapterOf,
  formatClock,
  imageIndexAt,
  imagesForPage,
  secondsBefore,
  storyProgress,
} from './readerLogic';

// The standard 32-page arc: chapters start on pages 1, 12 and 23 (STORY_SPEC §4).
const chapters = [
  { number: 2, firstPage: 12 },
  { number: 1, firstPage: 1 },
  { number: 3, firstPage: 23 },
];

describe('chapters', () => {
  test.each([
    [1, 1], [11, 1], [12, 2], [22, 2], [23, 3], [32, 3],
  ])('page %i is in chapter %i', (page, chapter) => {
    expect(chapterOf(chapters, page)).toBe(chapter);
  });
});

describe('afterPage', () => {
  test('moves to the next page inside a chapter', () => {
    expect(afterPage(5, 32, chapters)).toEqual({ type: 'page', page: 6 });
  });

  test('shows a chapter break after the last page of chapters 1 and 2', () => {
    expect(afterPage(11, 32, chapters)).toEqual({ type: 'chapterBreak', finishedChapter: 1, nextChapter: 2, nextPage: 12 });
    expect(afterPage(22, 32, chapters)).toEqual({ type: 'chapterBreak', finishedChapter: 2, nextChapter: 3, nextPage: 23 });
  });

  test('ends after the last page', () => {
    expect(afterPage(32, 32, chapters)).toEqual({ type: 'end' });
  });
});

describe('image sequencer timing', () => {
  test('each image stays for its duration, then the last one holds', () => {
    const durations = [2, 3, 1];
    expect(imageIndexAt(durations, 0)).toBe(0);
    expect(imageIndexAt(durations, 1999)).toBe(0);
    expect(imageIndexAt(durations, 2000)).toBe(1);
    expect(imageIndexAt(durations, 4999)).toBe(1);
    expect(imageIndexAt(durations, 5500)).toBe(2);
    expect(imageIndexAt(durations, 60_000)).toBe(2);
    expect(imageIndexAt([], 1000)).toBe(0);
  });

  test("a page's images come out in order", () => {
    const images = [
      { url: 'b', page: 3, order: 2, durationSec: 1 },
      { url: 'x', page: 4, order: 1, durationSec: 1 },
      { url: 'a', page: 3, order: 1, durationSec: 1 },
    ];
    expect(imagesForPage(images, 3).map((i) => i.url)).toEqual(['a', 'b']);
  });
});

describe('progress bar and clock', () => {
  test('chapter dots sit where each chapter starts', () => {
    const marks = chapterMarks(chapters, 32);
    expect(marks[0]).toBe(0);
    expect(marks[1]).toBeCloseTo(11 / 31);
    expect(marks[2]).toBeCloseTo(22 / 31);
  });

  test('progress runs from 0 on page 1 to 1 at the last page', () => {
    expect(storyProgress(1, 32)).toBe(0);
    expect(storyProgress(32, 32)).toBe(1);
    expect(storyProgress(2, 32, 0.5)).toBeCloseTo(1.5 / 31);
  });

  test('clock text and elapsed time', () => {
    expect(formatClock(112)).toBe('1:52');
    expect(formatClock(960)).toBe('16:00');
    expect(formatClock(-3)).toBe('0:00');
    expect(secondsBefore([30, 20, 25], 3)).toBe(50);
    expect(secondsBefore([30, 20, 25], 1)).toBe(0);
  });

  test('chapter length in minutes', () => {
    const durations = Array.from({ length: 32 }, () => 30); // 30 s per page
    expect(chapterMinutes(chapters, durations, 1)).toBe(6); // 11 pages × 30 s = 5.5 min
    expect(chapterMinutes(chapters, durations, 3)).toBe(5); // 10 pages × 30 s
  });
});

import { splitWords, spokenTokenIndex, swipeAction } from './readerLogic';

describe('swipe to turn pages', () => {
  test('right-to-left swipe is next in a left-to-right story, previous the other way', () => {
    expect(swipeAction(-120, 0, false)).toBe('next');
    expect(swipeAction(120, 0, false)).toBe('prev');
  });

  test('Arabic stories turn the other way, like a real book', () => {
    expect(swipeAction(120, 0, true)).toBe('next');
    expect(swipeAction(-120, 0, true)).toBe('prev');
  });

  test('a quick flick counts; a small drag does not', () => {
    expect(swipeAction(-30, -900, false)).toBe('next');
    expect(swipeAction(-30, -100, false)).toBeNull();
    expect(swipeAction(10, 2000, false)).toBeNull();
  });
});

describe('word highlighting', () => {
  test('splitting keeps the exact text', () => {
    const text = 'In the spring  of 711.';
    expect(splitWords(text).join('')).toBe(text);
  });

  test('follows the narration from the first to the last word', () => {
    const tokens = splitWords('Hi there wonderful explorer');
    expect(spokenTokenIndex(tokens, 0)).toBe(-1);
    expect(tokens[spokenTokenIndex(tokens, 0.01)]).toBe('Hi');
    expect(tokens[spokenTokenIndex(tokens, 0.5)]).toBe('wonderful');
    expect(tokens[spokenTokenIndex(tokens, 1)]).toBe('explorer');
    expect(tokens[spokenTokenIndex(tokens, 5)]).toBe('explorer');
  });

  test('works for Arabic words', () => {
    const tokens = splitWords('مرحبًا أيها المستكشف');
    expect(tokens[spokenTokenIndex(tokens, 0.99)]).toBe('المستكشف');
  });
});
