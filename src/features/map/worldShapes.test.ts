import { continentAt, continents } from './geography';
import { buildContinentPaths, clipRing, project, simplify, URALS_LNG, VIEW_HEIGHT, VIEW_WIDTH, WEST } from './worldShapes';

function pathPoints(d: string): [number, number][] {
  return [...d.matchAll(/(-?\d+(?:\.\d+)?) (-?\d+(?:\.\d+)?)/g)].map((m) => [Number(m[1]), Number(m[2])]);
}

describe('project (equirectangular)', () => {
  test('maps lat/lng into the view window', () => {
    expect(project(0, 0)).toEqual({ x: -WEST, y: 84 });
    const timbuktu = project(16.77, -3.0);
    expect(timbuktu.x).toBeCloseTo(166, 0);
    expect(timbuktu.y).toBeCloseTo(67.2, 1);
  });

  test('wraps the far east of the date line instead of jumping to the west edge', () => {
    expect(project(65, -175).x).toBeGreaterThan(VIEW_WIDTH - 10);
  });
});

describe('simplify', () => {
  test('keeps the shape of a closed ring (first point equals last)', () => {
    const square: [number, number][] = [[0, 0], [5, 0.01], [10, 0], [10, 10], [0, 10], [0, 0]];
    const result = simplify(square, 0.1);
    expect(result.length).toBeGreaterThanOrEqual(5);
    expect(result).not.toContainEqual([5, 0.01]);
  });
});

describe('clipRing', () => {
  const square: [number, number][] = [[0, 0], [10, 0], [10, 10], [0, 10]];
  test('splits a ring at a vertical edge', () => {
    expect(Math.max(...clipRing(square, 4, 'west').map((p) => p[0]))).toBe(4);
    expect(Math.min(...clipRing(square, 4, 'east').map((p) => p[0]))).toBe(4);
  });
});

describe('buildContinentPaths', () => {
  const paths = buildContinentPaths();

  test('every continent has land and no invalid numbers', () => {
    for (const continent of continents) {
      expect(paths[continent].length).toBeGreaterThan(100);
      expect(paths[continent]).not.toMatch(/NaN|Infinity/);
    }
  });

  test('stays light enough for a phone (simplified outlines)', () => {
    const total = continents.reduce((sum, c) => sum + pathPoints(paths[c]).length, 0);
    expect(total).toBeLessThan(8000);
  });

  test('Europe ends at the Urals and French Guiana is drawn with South America', () => {
    const uralsX = URALS_LNG - WEST;
    expect(Math.max(...pathPoints(paths.europe).map((p) => p[0]))).toBeLessThanOrEqual(uralsX + 0.05);
    expect(Math.max(...pathPoints(paths.asia).map((p) => p[0]))).toBeGreaterThan(uralsX + 100);
    const cayenne = project(4.9, -52.3);
    expect(pathPoints(paths.southAmerica).some((p) => Math.hypot(p[0] - cayenne.x, p[1] - cayenne.y) < 3)).toBe(true);
  });

  test('all land fits the view window (with a small margin)', () => {
    for (const continent of continents) {
      for (const [x, y] of pathPoints(paths[continent])) {
        expect(x).toBeGreaterThan(-15);
        expect(x).toBeLessThan(VIEW_WIDTH + 15);
        expect(y).toBeLessThanOrEqual(VIEW_HEIGHT + 2);
      }
    }
  });
});

describe('continentAt follows the map', () => {
  test.each([
    [55.75, 37.62, 'europe'], // Moscow
    [55.03, 82.92, 'asia'], // Novosibirsk: Russia east of the Urals
    [4.92, -52.31, 'southAmerica'], // Cayenne, French Guiana
  ] as const)('%s, %s is %s', (lat, lng, continent) => {
    expect(continentAt(lat, lng)).toBe(continent);
  });
});
