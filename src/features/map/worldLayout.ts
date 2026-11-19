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
