import rings from './continentRings.json';

export const continents = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia', 'oceania', 'antarctica'] as const;
export type Continent = typeof continents[number];

// Base canvas size: the continent view is worldHeight tall; the world view is worldWidth wide.
export const worldWidth = 1000;
export const worldHeight = 510;

type Box = { x: number; y: number; width: number; height: number };
/** Where each painted continent sits on the illustrated world (1000 × 510 units). */
export const placements: Record<Continent, Box> = {
  northAmerica: { x: 15, y: 18, width: 305, height: 230 },
  southAmerica: { x: 200, y: 218, width: 192, height: 225 },
  europe: { x: 420, y: 33, width: 214, height: 145 },
  africa: { x: 392, y: 166, width: 225, height: 221 }, // lowered + shifted west (owner, 2026-11-19)
  asia: { x: 598, y: 19, width: 359, height: 243 },
  oceania: { x: 735, y: 254, width: 225, height: 177 },
  antarctica: { x: 280, y: 428, width: 420, height: 70 },
};

const extents: Record<Continent, [west: number, east: number, south: number, north: number]> = {
  africa: [-18, 52, -35, 38], europe: [-25, 65, 34, 72], asia: [25, 190, -11, 79],
  northAmerica: [-171, -52, 7, 80], southAmerica: [-82, -34, -56, 13],
  oceania: [110, 184, -49, 0], antarctica: [-180, 180, -90, -60],
};

/**
 * Continent of a place, as drawn on the map. Natural Earth files all of Russia and French Guiana
 * under Europe; the map shows Russia east of the Urals (60°E) as Asia and anything west of 30°W as non-European.
 */
export function continentAt(lat: number, lng: number): Continent {
  const continent = naturalEarthContinentAt(lat, lng);
  if (continent === 'europe' && lng > 60) return 'asia';
  if (continent === 'europe' && lng < -30) return 'southAmerica';
  return continent;
}

function naturalEarthContinentAt(lat: number, lng: number): Continent {
  const x = lng * 100;
  const y = lat * 100;
  let best: Continent = 'africa';
  let distance = Infinity;
  for (const continent of continents) {
    for (const ring of rings[continent]) {
      let inside = false;
      for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
        const ax = ring[j]!, ay = ring[j + 1]!, bx = ring[i]!, by = ring[i + 1]!;
        if ((ay > y) !== (by > y) && x < ax + (bx - ax) * (y - ay) / (by - ay)) inside = !inside;
        // Nearest coast fallback for islands omitted at this map scale.
        const dx = bx - ax, dy = by - ay;
        const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)));
        const dist = Math.min(Math.abs(x - ax - t * dx), Math.abs(x - ax - t * dx + 36000), Math.abs(x - ax - t * dx - 36000)) ** 2 + (y - ay - t * dy) ** 2;
        if (dist < distance) { best = continent; distance = dist; }
      }
      if (inside) return continent;
    }
  }
  return best;
}

/**
 * Control points measured on each painted continent (owner, BACKLOG #35): where a known place actually
 * appears in the artwork, as fractions (u, v) of the image width and height. A least-squares affine fit
 * turns latitude/longitude into artwork position, so pins land on the painted coastline.
 * Continents without points fall back to their geographic bounding box.
 */
type ControlPoint = { lat: number; lng: number; u: number; v: number };
export const calibration: Partial<Record<Continent, ControlPoint[]>> = {
  africa: [
    { lat: 35.8, lng: -5.8, u: 0.17, v: 0.04 }, // Tangier, north-west tip
    { lat: 14.7, lng: -17.4, u: 0.01, v: 0.29 }, // Dakar, westmost bulge
    { lat: 4.0, lng: 9.7, u: 0.27, v: 0.43 }, // Gulf of Guinea corner
    { lat: 30.0, lng: 31.2, u: 0.7, v: 0.11 }, // Cairo / Nile delta
    { lat: 11.8, lng: 51.3, u: 0.99, v: 0.31 }, // Horn of Africa
    { lat: -34.4, lng: 18.5, u: 0.43, v: 0.98 }, // Cape of Good Hope
  ],
  europe: [
    { lat: 36.1, lng: -5.35, u: 0.13, v: 0.93 }, // Gibraltar
    { lat: 38.7, lng: -9.5, u: 0.01, v: 0.82 }, // Cabo da Roca
    { lat: 48.4, lng: -4.5, u: 0.2, v: 0.61 }, // Brittany
    { lat: 53.3, lng: -6.3, u: 0.15, v: 0.4 }, // Dublin
    { lat: 55.7, lng: 12.6, u: 0.43, v: 0.4 }, // Copenhagen
    { lat: 71.0, lng: 25.8, u: 0.66, v: 0.02 }, // North Cape
    { lat: 38.0, lng: 15.7, u: 0.57, v: 0.88 }, // Toe of Italy
    { lat: 41.0, lng: 29.0, u: 0.86, v: 0.73 }, // Istanbul
  ],
};

type Affine = { u: [number, number, number]; v: [number, number, number] };

/** Least-squares fit of u = a·lng + b·lat + c (and the same for v). */
export function fitAffine(points: readonly ControlPoint[]): Affine {
  // Normal equations for [lng, lat, 1].
  const m = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const ru = [0, 0, 0];
  const rv = [0, 0, 0];
  for (const p of points) {
    const row = [p.lng, p.lat, 1];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) m[i]![j]! += row[i]! * row[j]!;
      ru[i]! += row[i]! * p.u;
      rv[i]! += row[i]! * p.v;
    }
  }
  return { u: solve3(m, ru), v: solve3(m, rv) };
}

function solve3(m: number[][], r: number[]): [number, number, number] {
  const det = (a: number[][]) =>
    a[0]![0]! * (a[1]![1]! * a[2]![2]! - a[1]![2]! * a[2]![1]!) -
    a[0]![1]! * (a[1]![0]! * a[2]![2]! - a[1]![2]! * a[2]![0]!) +
    a[0]![2]! * (a[1]![0]! * a[2]![1]! - a[1]![1]! * a[2]![0]!);
  const d = det(m);
  const col = (k: number) => m.map((row, i) => row.map((value, j) => (j === k ? r[i]! : value)));
  return [det(col(0)) / d, det(col(1)) / d, det(col(2)) / d];
}

/**
 * Artwork position for a place: the affine fit plus an inverse-distance-weighted correction from each
 * control point's residual, so measured places land exactly and positions between them stay smooth.
 */
export function calibratedPoint(points: readonly ControlPoint[], fit: Affine, lat: number, lng: number) {
  const base = (p: { lat: number; lng: number }) => ({
    u: fit.u[0] * p.lng + fit.u[1] * p.lat + fit.u[2],
    v: fit.v[0] * p.lng + fit.v[1] * p.lat + fit.v[2],
  });
  const at = base({ lat, lng });
  let wSum = 0;
  let du = 0;
  let dv = 0;
  for (const p of points) {
    const d2 = (p.lat - lat) ** 2 + (p.lng - lng) ** 2;
    if (d2 < 1e-9) return { u: p.u, v: p.v };
    const w = 1 / d2;
    const b = base(p);
    wSum += w;
    du += w * (p.u - b.u);
    dv += w * (p.v - b.v);
  }
  return { u: at.u + du / wSum, v: at.v + dv / wSum };
}

const fitted: Partial<Record<Continent, Affine>> = Object.fromEntries(
  Object.entries(calibration).map(([c, points]) => [c, fitAffine(points!)]),
);

export function storyPoint(continent: Continent, lat: number, lng: number) {
  const clamp = (n: number) => Math.max(0.03, Math.min(0.97, n));
  const fit = fitted[continent];
  const points = calibration[continent];
  if (fit && points) {
    const p = calibratedPoint(points, fit, lat, lng);
    return { x: clamp(p.u), y: clamp(p.v) };
  }
  const [west, east, south, north] = extents[continent];
  const longitude = east > 180 && lng < 0 ? lng + 360 : lng;
  return { x: clamp((longitude - west) / (east - west)), y: clamp((north - lat) / (north - south)) };
}

export function groupNearby<T>(points: { x: number; y: number; item: T }[], radius: number) {
  const groups: { x: number; y: number; items: T[] }[] = [];
  for (const point of points) {
    const nearby = groups.find(group => Math.hypot(group.x - point.x, group.y - point.y) < radius);
    if (nearby) nearby.items.push(point.item);
    else groups.push({ x: point.x, y: point.y, items: [point.item] });
  }
  return groups;
}
