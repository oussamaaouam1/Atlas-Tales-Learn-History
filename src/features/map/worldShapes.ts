import rings from './continentRings.json';
import { continents, type Continent } from './geography';

/**
 * Flat world map geometry (BUILD_GUIDE §7.1): Natural Earth outlines on an equirectangular
 * projection, so lat/lng → x/y is exact and pins land on their places.
 * View window: longitude −169°…191° (keeps Alaska and Chukotka whole), latitude 84°N…72°S.
 * Coordinates are in degrees (1 unit = 1°); the SVG scales the viewBox to the screen.
 */
export const WEST = -169;
export const NORTH = 84;
export const SOUTH = -72;
export const VIEW_WIDTH = 360;
export const VIEW_HEIGHT = NORTH - SOUTH;
export const OCEAN = '#7CC8EE';

/** Equirectangular projection into the view window (0…360 × 0…156). */
export function project(lat: number, lng: number): { x: number; y: number } {
  const shifted = lng < WEST ? lng + 360 : lng;
  return { x: shifted - WEST, y: NORTH - lat };
}

/** Urals: Natural Earth files all of Russia under Europe; east of 60°E is shown as Asia. */
export const URALS_LNG = 60;
const URALS_X = URALS_LNG - WEST;
const OVERSEAS_X = -30 - WEST; // west of 30°W nothing is geographically European

// Eastern-hemisphere land that crosses the date line (Chukotka, Fiji) is shifted east as a whole ring;
// the Americas never shift, so Alaska and Chukotka cannot join into one stray line.
const SHIFTS_ACROSS_DATE_LINE: ReadonlySet<Continent> = new Set(['europe', 'asia', 'oceania', 'antarctica']);

type Point = [x: number, y: number];

function ringArea(points: Point[]): number {
  let sum = 0;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    sum += (points[j]![0] - points[i]![0]) * (points[j]![1] + points[i]![1]);
  }
  return Math.abs(sum / 2);
}

/** Ramer–Douglas–Peucker line simplification. */
export function simplify(points: Point[], epsilon: number): Point[] {
  if (points.length < 3) return points;
  const [ax, ay] = points[0]!;
  const [bx, by] = points[points.length - 1]!;
  const length = Math.hypot(bx - ax, by - ay);
  let maxDistance = 0;
  let index = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [px, py] = points[i]!;
    // Closed rings start and end on the same point: measure to that point instead of a line.
    const distance =
      length === 0
        ? Math.hypot(px - ax, py - ay)
        : Math.abs((by - ay) * px - (bx - ax) * py + bx * ay - by * ax) / length;
    if (distance > maxDistance) {
      maxDistance = distance;
      index = i;
    }
  }
  if (maxDistance <= epsilon) return [points[0]!, points[points.length - 1]!];
  return [...simplify(points.slice(0, index + 1), epsilon).slice(0, -1), ...simplify(points.slice(index), epsilon)];
}

/** Sutherland–Hodgman clip of a ring against the vertical line x = edge. */
export function clipRing(points: Point[], edge: number, keep: 'west' | 'east'): Point[] {
  const inside = (p: Point) => (keep === 'west' ? p[0] <= edge : p[0] >= edge);
  const out: Point[] = [];
  for (let i = 0; i < points.length; i++) {
    const current = points[i]!;
    const previous = points[(i + points.length - 1) % points.length]!;
    const crossing = (): Point => {
      const t = (edge - previous[0]) / (current[0] - previous[0]);
      return [edge, previous[1] + t * (current[1] - previous[1])];
    };
    if (inside(current)) {
      if (!inside(previous)) out.push(crossing());
      out.push(current);
    } else if (inside(previous)) {
      out.push(crossing());
    }
  }
  return out;
}

const MIN_ISLAND_AREA = 0.8; // square degrees: keeps Madagascar, Japan, UK, NZ, Sri Lanka; drops specks
const EPSILON = 0.25; // degrees

function toPath(points: Point[]): string {
  return `M${points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join('L')}Z`;
}

function projectedRings(continent: Continent): Point[][] {
  return rings[continent].map((ring) => {
    const points: Point[] = [];
    for (let i = 0; i + 1 < ring.length; i += 2) {
      const lng = ring[i]! / 100;
      const lat = ring[i + 1]! / 100;
      const shifted = SHIFTS_ACROSS_DATE_LINE.has(continent) && lng < WEST ? lng + 360 : lng;
      points.push([shifted - WEST, Math.min(NORTH - lat, VIEW_HEIGHT + 2)]); // clip far south to the window edge
    }
    return points;
  });
}

/** Builds one SVG path per continent (all its land), simplified for a phone-sized map. */
export function buildContinentPaths(): Record<Continent, string> {
  const byContinent = {} as Record<Continent, Point[][]>;
  for (const continent of continents) byContinent[continent] = projectedRings(continent);

  // Split Russia at the Urals: west stays Europe, east joins Asia.
  const europe: Point[][] = [];
  for (const ring of byContinent.europe) {
    // Overseas land filed under a European country (French Guiana) belongs to its own continent.
    if (ring.every((p) => p[0] < OVERSEAS_X)) {
      byContinent.southAmerica.push(ring);
      continue;
    }
    if (ring.every((p) => p[0] <= URALS_X)) {
      europe.push(ring);
      continue;
    }
    europe.push(clipRing(ring, URALS_X, 'west'));
    byContinent.asia.push(clipRing(ring, URALS_X, 'east'));
  }
  byContinent.europe = europe;

  const result = {} as Record<Continent, string>;
  for (const continent of continents) {
    const parts: string[] = [];
    for (const points of byContinent[continent]) {
      if (points.length < 3 || ringArea(points) < MIN_ISLAND_AREA) continue;
      const simplified = simplify(points, EPSILON);
      if (simplified.length >= 3) parts.push(toPath(simplified));
    }
    result[continent] = parts.join('');
  }
  return result;
}

/** Where each continent's name chip sits (lat, lng). */
export const labelAnchors: Record<Continent, [lat: number, lng: number]> = {
  northAmerica: [50, -103],
  southAmerica: [-14, -60],
  europe: [53, 20],
  africa: [6, 20],
  asia: [50, 95],
  oceania: [-26, 134],
  antarctica: [-68, 20],
};

/** Flat Bright Explorer fills (world view); the painted art is used when zoomed in. */
export const continentFill: Record<Continent, string> = {
  northAmerica: '#7FD07A',
  southAmerica: '#4DBB74',
  europe: '#FFD25E',
  africa: '#F7A75A',
  asia: '#B5E37A',
  oceania: '#F59C85',
  antarctica: '#F4FAFF',
};
