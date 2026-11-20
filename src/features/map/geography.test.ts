import { continentAt, groupNearby, storyPoint } from './geography';

test.each([
  [16.7666, -3.0026, 'africa'],
  [48.8566, 2.3522, 'europe'],
  [35.6762, 139.6503, 'asia'],
  [40.7128, -74.006, 'northAmerica'],
  [-12.0464, -77.0428, 'southAmerica'],
  [-33.8688, 151.2093, 'oceania'],
  [-82, 0, 'antarctica'],
] as const)('places %s, %s in %s', (lat, lng, continent) => {
  expect(continentAt(lat, lng)).toBe(continent);
  const point = storyPoint(continent, lat, lng);
  expect(point.x).toBeGreaterThan(0);
  expect(point.x).toBeLessThan(1);
  expect(point.y).toBeGreaterThan(0);
  expect(point.y).toBeLessThan(1);
});
test('keeps both fixture stories reachable from one shared location pin', () => {
  const points = [
    { x: 88, y: 65, item: 'placeholder-one' },
    { x: 88, y: 65, item: 'placeholder-two' },
    { x: 180, y: 65, item: 'other' },
  ];
  expect(groupNearby(points, 44).map(group => group.items)).toEqual([
    ['placeholder-one', 'placeholder-two'], ['other'],
  ]);
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

import { calibratedPoint, calibration, fitAffine } from './geography';

describe('artwork calibration', () => {
  test.each(Object.entries(calibration))('%s: measured places land exactly where they are painted', (_, points) => {
    const fit = fitAffine(points!);
    for (const p of points!) {
      const at = calibratedPoint(points!, fit, p.lat, p.lng);
      expect(at.u).toBeCloseTo(p.u, 6);
      expect(at.v).toBeCloseTo(p.v, 6);
    }
  });

  test('the plain affine fit is already close (within 9%)', () => {
    for (const points of Object.values(calibration)) {
      const fit = fitAffine(points!);
      for (const p of points!) {
        const u = fit.u[0] * p.lng + fit.u[1] * p.lat + fit.u[2];
        const v = fit.v[0] * p.lng + fit.v[1] * p.lat + fit.v[2];
        expect(Math.hypot(u - p.u, v - p.v)).toBeLessThan(0.09);
      }
    }
  });

  test('Timbuktu sits in the west Sahel of the Africa painting and Gibraltar at the tip of Iberia', () => {
    const t = storyPoint('africa', 16.77, -3.0);
    expect(t.x).toBeGreaterThan(0.15);
    expect(t.x).toBeLessThan(0.4);
    expect(t.y).toBeGreaterThan(0.2);
    expect(t.y).toBeLessThan(0.35);
    const g = storyPoint('europe', 36.14, -5.35);
    expect(g.x).toBeLessThan(0.2);
    expect(g.y).toBeGreaterThan(0.85);
  });
});
