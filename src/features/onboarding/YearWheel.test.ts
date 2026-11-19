import { indexAtOffset, ITEM_HEIGHT } from './YearWheel';

describe('YearWheel snapping', () => {
  test('rounds a scroll offset to the nearest year and stays in range', () => {
    expect(indexAtOffset(0, 101)).toBe(0);
    expect(indexAtOffset(ITEM_HEIGHT * 3.4, 101)).toBe(3);
    expect(indexAtOffset(ITEM_HEIGHT * 3.6, 101)).toBe(4);
    expect(indexAtOffset(-50, 101)).toBe(0);
    expect(indexAtOffset(ITEM_HEIGHT * 500, 101)).toBe(100);
  });
});
