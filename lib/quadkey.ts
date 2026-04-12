/**
 * Bing Maps Tile System utilities for converting between
 * lat/lon coordinates and quadkeys.
 *
 * Reference: https://learn.microsoft.com/en-us/bingmaps/articles/bing-maps-tile-system
 */

const EARTH_RADIUS = 6378137;
const MIN_LAT = -85.05112878;
const MAX_LAT = 85.05112878;

function clip(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

/** Convert lat/lon to pixel coordinates at a given zoom level. */
function latLonToPixelXY(
  lat: number,
  lon: number,
  level: number
): { pixelX: number; pixelY: number } {
  const clippedLat = clip(lat, MIN_LAT, MAX_LAT);
  const clippedLon = clip(lon, -180, 180);

  const x = (clippedLon + 180) / 360;
  const sinLat = Math.sin((clippedLat * Math.PI) / 180);
  const y = 0.5 - Math.log((1 + sinLat) / (1 - sinLat)) / (4 * Math.PI);

  const mapSize = 256 << level;
  const pixelX = clip(x * mapSize + 0.5, 0, mapSize - 1);
  const pixelY = clip(y * mapSize + 0.5, 0, mapSize - 1);

  return { pixelX: Math.floor(pixelX), pixelY: Math.floor(pixelY) };
}

/** Convert pixel coordinates to tile coordinates. */
function pixelToTileXY(
  pixelX: number,
  pixelY: number
): { tileX: number; tileY: number } {
  return {
    tileX: Math.floor(pixelX / 256),
    tileY: Math.floor(pixelY / 256),
  };
}

/** Convert tile X/Y at a zoom level to a quadkey string. */
function tileXYToQuadkey(tileX: number, tileY: number, level: number): string {
  const digits: string[] = [];
  for (let i = level; i > 0; i--) {
    let digit = 0;
    const mask = 1 << (i - 1);
    if ((tileX & mask) !== 0) digit += 1;
    if ((tileY & mask) !== 0) digit += 2;
    digits.push(digit.toString());
  }
  return digits.join("");
}

/** Convert a quadkey back to its bounding box (south, west, north, east). */
export function quadkeyToBBox(quadkey: string): {
  south: number;
  west: number;
  north: number;
  east: number;
} {
  const level = quadkey.length;
  let tileX = 0;
  let tileY = 0;

  for (let i = level; i > 0; i--) {
    const mask = 1 << (i - 1);
    const digit = parseInt(quadkey[level - i], 10);
    if (digit & 1) tileX |= mask;
    if (digit & 2) tileY |= mask;
  }

  const mapSize = 256 << level;
  const lonWest = (tileX * 256) / mapSize * 360 - 180;
  const lonEast = ((tileX + 1) * 256) / mapSize * 360 - 180;

  const n = Math.PI - (2 * Math.PI * tileY * 256) / mapSize;
  const latNorth = (180 / Math.PI) * Math.atan(Math.sinh(n));

  const s = Math.PI - (2 * Math.PI * (tileY + 1) * 256) / mapSize;
  const latSouth = (180 / Math.PI) * Math.atan(Math.sinh(s));

  return { south: latSouth, west: lonWest, north: latNorth, east: lonEast };
}

/** Convert lat/lon to a quadkey at the given zoom level. */
export function latLonToQuadkey(
  lat: number,
  lon: number,
  level: number
): string {
  const { pixelX, pixelY } = latLonToPixelXY(lat, lon, level);
  const { tileX, tileY } = pixelToTileXY(pixelX, pixelY);
  return tileXYToQuadkey(tileX, tileY, level);
}

/**
 * Get all quadkeys at a given level that intersect a bounding box.
 * Returns unique quadkey strings.
 */
export function bboxToQuadkeys(
  south: number,
  west: number,
  north: number,
  east: number,
  level: number
): string[] {
  const { pixelX: minPixelX, pixelY: minPixelY } = latLonToPixelXY(
    north,
    west,
    level
  );
  const { pixelX: maxPixelX, pixelY: maxPixelY } = latLonToPixelXY(
    south,
    east,
    level
  );

  const { tileX: minTileX, tileY: minTileY } = pixelToTileXY(
    minPixelX,
    minPixelY
  );
  const { tileX: maxTileX, tileY: maxTileY } = pixelToTileXY(
    maxPixelX,
    maxPixelY
  );

  const quadkeys: string[] = [];
  for (let tileX = minTileX; tileX <= maxTileX; tileX++) {
    for (let tileY = minTileY; tileY <= maxTileY; tileY++) {
      quadkeys.push(tileXYToQuadkey(tileX, tileY, level));
    }
  }

  return quadkeys;
}
