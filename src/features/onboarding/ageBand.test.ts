import { ageBandFromBirthYear, selectableBirthYears } from './ageBand';

const YEAR = 2026;

describe('ageBandFromBirthYear (child under 13, teen 13-17, adult 18+, conservative)', () => {
  test.each([
    [2026, 'child'],
    [2014, 'child'], // 11 or 12
    [2013, 'child'], // 12 or 13, assume 12
    [2012, 'teen'], // 13 or 14
    [2009, 'teen'], // 16 or 17
    [2008, 'teen'], // 17 or 18, assume 17
    [2007, 'adult'], // 18 or 19
    [1950, 'adult'],
  ] as const)('born %i is %s', (year, band) => {
    expect(ageBandFromBirthYear(year, YEAR)).toBe(band);
  });

  test('no answer or impossible years give unknown', () => {
    expect(ageBandFromBirthYear(null, YEAR)).toBe('unknown');
    expect(ageBandFromBirthYear(2030, YEAR)).toBe('unknown');
    expect(ageBandFromBirthYear(1800, YEAR)).toBe('unknown');
    expect(ageBandFromBirthYear(2000.5, YEAR)).toBe('unknown');
  });

  test('selectable years run from this year back 100 years, newest first', () => {
    const years = selectableBirthYears(YEAR);
    expect(years[0]).toBe(2026);
    expect(years.at(-1)).toBe(1926);
    expect(years).toHaveLength(101);
  });
});
