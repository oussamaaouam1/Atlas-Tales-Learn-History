/**
 * Pure story-player logic (BUILD_GUIDE §7.2), kept free of React so it can be tested.
 */
export interface ChapterInfo {
  number: number;
  firstPage: number;
}

export interface TimedImage {
  url: string;
  page: number;
  order: number;
  durationSec: number;
}

export type AfterPage =
  | { type: 'page'; page: number }
  | { type: 'chapterBreak'; finishedChapter: number; nextChapter: number; nextPage: number }
  | { type: 'end' };

export function sortedChapters(chapters: readonly ChapterInfo[]): ChapterInfo[] {
  return [...chapters].sort((a, b) => a.firstPage - b.firstPage);
}

/** Chapter number that contains a page. */
export function chapterOf(chapters: readonly ChapterInfo[], page: number): number {
  let current = sortedChapters(chapters)[0]?.number ?? 1;
  for (const c of sortedChapters(chapters)) if (page >= c.firstPage) current = c.number;
  return current;
}

/** What comes after finishing `page`: the next page, a chapter break (after chapters 1 and 2), or the end. */
export function afterPage(page: number, pageCount: number, chapters: readonly ChapterInfo[]): AfterPage {
  if (page >= pageCount) return { type: 'end' };
  const next = page + 1;
  const now = chapterOf(chapters, page);
  const then = chapterOf(chapters, next);
  if (then !== now) return { type: 'chapterBreak', finishedChapter: now, nextChapter: then, nextPage: next };
  return { type: 'page', page: next };
}

/** A page's images in display order. */
export function imagesForPage<T extends TimedImage>(images: readonly T[], page: number): T[] {
  return images.filter((i) => i.page === page).sort((a, b) => a.order - b.order);
}

/**
 * Which image of a page is showing `elapsedMs` into the page: each image stays for its durationSec;
 * after the last one ends, the last image stays (narration may run longer).
 */
export function imageIndexAt(durationsSec: readonly number[], elapsedMs: number): number {
  if (durationsSec.length === 0) return 0;
  let end = 0;
  for (let i = 0; i < durationsSec.length; i++) {
    end += Math.max(0, durationsSec[i]!) * 1000;
    if (elapsedMs < end) return i;
  }
  return durationsSec.length - 1;
}

/** Position (0–1) where each chapter starts on the story progress bar, for the chapter dots. */
export function chapterMarks(chapters: readonly ChapterInfo[], pageCount: number): number[] {
  if (pageCount <= 1) return [0];
  return sortedChapters(chapters).map((c) => (c.firstPage - 1) / (pageCount - 1));
}

/** Story progress 0–1 for the bar's fill and the guide knob, with a smooth part inside the page. */
export function storyProgress(page: number, pageCount: number, pageFraction = 0): number {
  if (pageCount <= 1) return 1;
  const clamped = Math.max(0, Math.min(1, pageFraction));
  return Math.max(0, Math.min(1, (page - 1 + clamped) / (pageCount - 1)));
}

/** Seconds of narration before `page` begins (for the "1:52 / 16:00" clock). */
export function secondsBefore(pageDurationsSec: readonly number[], page: number): number {
  return pageDurationsSec.slice(0, Math.max(0, page - 1)).reduce((sum, d) => sum + d, 0);
}

/** m:ss, e.g. 112 → "1:52". */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.round(totalSec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Text card sizes (design 7I: three sizes). Multipliers on the body-large style. */
export const TEXT_SCALES = { small: 0.85, medium: 1, large: 1.2 } as const;
export type TextScale = keyof typeof TEXT_SCALES;

/** Rounded minutes for a chapter, from its pages' narration (design: "5 min"). */
export function chapterMinutes(chapters: readonly ChapterInfo[], pageDurationsSec: readonly number[], chapterNumber: number): number {
  const sorted = sortedChapters(chapters);
  const index = sorted.findIndex((c) => c.number === chapterNumber);
  if (index < 0) return 0;
  const start = sorted[index]!.firstPage;
  const end = sorted[index + 1]?.firstPage ?? pageDurationsSec.length + 1;
  const seconds = pageDurationsSec.slice(start - 1, end - 1).reduce((sum, d) => sum + d, 0);
  return Math.max(1, Math.round(seconds / 60));
}

/**
 * A sideways swipe on the art (owner, BACKLOG #39): right-to-left = next page in a left-to-right
 * story; reversed for Arabic, like a real book. Needs a clear distance or a quick flick.
 */
export function swipeAction(translationX: number, velocityX: number, rtl: boolean): 'next' | 'prev' | null {
  const far = Math.abs(translationX) > 60;
  const quick = Math.abs(velocityX) > 600 && Math.abs(translationX) > 20;
  if (!far && !quick) return null;
  const towardStart = translationX < 0; // finger moved left
  return towardStart !== rtl ? 'next' : 'prev';
}

/** Words and the spaces between them, so the text can be rebuilt exactly. */
export function splitWords(text: string): string[] {
  return text.split(/(\s+)/).filter((part) => part.length > 0);
}

/**
 * Index (in the splitWords array) of the word being spoken at `fraction` (0–1) of the page narration,
 * weighting each word by its length so long words take longer (owner, BACKLOG #40). -1 before the start.
 */
export function spokenTokenIndex(tokens: readonly string[], fraction: number): number {
  const words = tokens.map((t, i) => ({ i, len: /\S/.test(t) ? t.length + 1 : 0 })).filter((w) => w.len > 0);
  const total = words.reduce((s, w) => s + w.len, 0);
  if (total === 0 || fraction <= 0) return -1;
  const target = Math.min(1, fraction) * total;
  let acc = 0;
  for (const w of words) {
    acc += w.len;
    if (target <= acc) return w.i;
  }
  return words.at(-1)!.i;
}

/**
 * Sentences of a page, keeping their punctuation (owner, BACKLOG #46: show the text line by line).
 * Splits after . ! ? … and the Arabic question mark ؟ when followed by a space.
 */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?…؟])\s+/u)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

/**
 * Which sentence is being read at `fraction` (0–1) of the page narration, weighted by sentence length,
 * and how far (0–1) into that sentence the narration is.
 */
export function sentenceAt(sentences: readonly string[], fraction: number): { index: number; local: number } {
  if (sentences.length === 0) return { index: 0, local: 0 };
  const lengths = sentences.map((s) => s.length + 1);
  const total = lengths.reduce((a, b) => a + b, 0);
  const target = Math.max(0, Math.min(1, fraction)) * total;
  let start = 0;
  for (let i = 0; i < lengths.length; i++) {
    const end = start + lengths[i]!;
    if (target < end || i === lengths.length - 1) {
      return { index: i, local: Math.max(0, Math.min(1, (target - start) / lengths[i]!)) };
    }
    start = end;
  }
  return { index: sentences.length - 1, local: 1 };
}
