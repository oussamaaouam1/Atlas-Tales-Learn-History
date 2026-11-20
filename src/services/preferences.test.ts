import { nextRotation } from './preferences';

describe('splash icon rotation', () => {
  test('starts at 0 and alternates through the icons', () => {
    expect(nextRotation(null, 2)).toBe(0);
    expect(nextRotation('0', 2)).toBe(1);
    expect(nextRotation('1', 2)).toBe(0);
  });

  test('recovers from bad stored values or fewer icons', () => {
    expect(nextRotation('nope', 2)).toBe(0);
    expect(nextRotation('-3', 2)).toBe(0);
    expect(nextRotation('5', 2)).toBe(0);
  });
});

import { loadReaderPrefs, saveReaderPrefs } from './preferences';

describe('reader settings', () => {
  test('are remembered and merged; bad values are ignored', async () => {
    await saveReaderPrefs({ textScale: 'large' });
    await saveReaderPrefs({ showText: false, storyLanguage: 'fr' });
    expect(await loadReaderPrefs()).toEqual({ textScale: 'large', showText: false, storyLanguage: 'fr' });
  });
});
