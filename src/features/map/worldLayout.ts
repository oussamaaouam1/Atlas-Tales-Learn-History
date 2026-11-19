import { continentAt, placements, storyPoint, worldHeight, worldWidth, type Continent } from './geography';

type Point = { x: number; y: number };
type Rect = Point & { width: number; height: number };

/**
 * Fits the illustrated world to any screen shape without cropping or scrolling (owner, BACKLOG #18).
 * Each painted continent keeps its proportions (uniform size factor s) while the continents are
 * spread to fill the screen (positions use sx / sy): a little wider on phones, a little taller on iPad.
 */
export function worldLayout(width: number, height: number) {
  const sx = width / worldWidth;
  const sy = height / worldHeight;
  const s = Math.min(sx, sy);
  const tile = (continent: Continent): Rect => {
    const box = placements[continent];
    const w = box.width * s;
    const h = box.height * s;
    return { x: (box.x + box.width / 2) * sx - w / 2, y: (box.y + box.height / 2) * sy - h / 2, width: w, height: h };
  };
  /** Open-ocean positions (waves, boat, compass) spread with the continents. */
  const ocean = (p: Point): Point => ({ x: p.x * sx, y: p.y * sy });
  /** A story inside its continent artwork (approximate within the painting). */
  const story = (lat: number, lng: number): Point => {
    const continent = continentAt(lat, lng);
    const rect = tile(continent);
    const p = storyPoint(continent, lat, lng);
    return { x: rect.x + p.x * rect.width, y: rect.y + p.y * rect.height };
  };
  return { sx, sy, s, tile, ocean, story };
}
export type WorldLayout = ReturnType<typeof worldLayout>;

/** Story pin colour per continent (Bright Explorer palette; owner, BACKLOG #20). */
export const continentPinColor: Record<Continent, string> = {
  northAmerica: '#1C5BD9', // voyage blue
  southAmerica: '#17845A', // palm green
  europe: '#7A4DD8', // purple
  africa: '#FF7A3D', // tangerine
  asia: '#C62F2F', // red
  oceania: '#E0A100', // deep sunny yellow (readable white centre)
  antarctica: '#2A9DB8', // glacier teal
};

/**
 * Offsets that fan several pins at one place into a small arc, so each story stays visible and
 * tappable (instead of one pin with a number). Centred on the place; outer pins sit slightly lower.
 */
export function fanOffsets(count: number, spacing = 18): Point[] {
  return Array.from({ length: count }, (_, i) => {
    const d = i - (count - 1) / 2;
    return { x: d * spacing, y: Math.abs(d) * 4 };
  });
}
