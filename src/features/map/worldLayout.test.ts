import { continents, placements } from './geography';
import { worldLayout } from './worldLayout';

describe('worldLayout fits any screen without cropping', () => {
  test.each([
    ['phone landscape', 800, 390],
    ['iPad landscape', 1180, 820],
    ['very wide', 1400, 400],
    ['square-ish', 700, 650],
  ])('%s: every continent is fully on screen and keeps its proportions', (_, width, height) => {
    const layout = worldLayout(width, height);
    for (const continent of continents) {
      const rect = layout.tile(continent);
      expect(rect.x).toBeGreaterThanOrEqual(-0.01);
      expect(rect.y).toBeGreaterThanOrEqual(-0.01);
      expect(rect.x + rect.width).toBeLessThanOrEqual(width + 0.01);
      expect(rect.y + rect.height).toBeLessThanOrEqual(height + 0.01);
      const box = placements[continent];
      expect(rect.width / rect.height).toBeCloseTo(box.width / box.height, 5);
    }
  });

  test('a story lands inside its continent artwork', () => {
    const layout = worldLayout(800, 390);
    const timbuktu = layout.story(16.77, -3.0);
    const africa = layout.tile('africa');
    expect(timbuktu.x).toBeGreaterThan(africa.x);
    expect(timbuktu.x).toBeLessThan(africa.x + africa.width);
    expect(timbuktu.y).toBeGreaterThan(africa.y);
    expect(timbuktu.y).toBeLessThan(africa.y + africa.height);
  });
});

import { continentPinColor, fanOffsets } from './worldLayout';

describe('story pins', () => {
  test('every continent has its own pin colour', () => {
    const colours = continents.map((c) => continentPinColor[c]);
    expect(new Set(colours).size).toBe(continents.length);
  });

  test('a single story sits exactly on its place', () => {
    expect(fanOffsets(1)).toEqual([{ x: 0, y: 0 }]);
  });

  test('several stories fan out symmetrically around the place', () => {
    const offsets = fanOffsets(3, 18);
    expect(offsets.map((o) => o.x)).toEqual([-18, 0, 18]);
    expect(offsets[0]!.y).toBe(offsets[2]!.y);
    expect(offsets[1]!.y).toBe(0);
  });
});
