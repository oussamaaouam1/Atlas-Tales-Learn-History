import rings from './continentRings.json';

export const continents = ['northAmerica', 'southAmerica', 'europe', 'africa', 'asia', 'oceania', 'antarctica'] as const;
export type Continent = typeof continents[number];
type Box = { x: number; y: number; width: number; height: number };
export const worldWidth = 1000;
export const worldHeight = 510;
export const placements: Record<Continent, Box> = {
  northAmerica: { x: 35, y: 18, width: 305, height: 230 },
  southAmerica: { x: 220, y: 218, width: 192, height: 225 },
  europe: { x: 420, y: 33, width: 214, height: 145 },
  africa: { x: 412, y: 144, width: 225, height: 221 },
  asia: { x: 598, y: 19, width: 359, height: 243 },
  oceania: { x: 735, y: 254, width: 225, height: 177 },
  antarctica: { x: 280, y: 428, width: 420, height: 70 },
};

const extents: Record<Continent, [west: number, east: number, south: number, north: number]> = {
  africa: [-18, 52, -35, 38], europe: [-25, 65, 34, 72], asia: [25, 190, -11, 79],
  northAmerica: [-171, -52, 7, 80], southAmerica: [-82, -34, -56, 13],
  oceania: [110, 184, -49, 0], antarctica: [-180, 180, -90, -60],
};

export function continentAt(lat: number, lng: number): Continent {
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

export function storyPoint(continent: Continent, lat: number, lng: number) {
  const [west, east, south, north] = extents[continent];
  const clamp = (n: number) => Math.max(0.05, Math.min(0.95, n));
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
