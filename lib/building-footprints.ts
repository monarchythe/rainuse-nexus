import { bboxToQuadkeys } from "./quadkey";
import {
  polygonAreaSqFt,
  polygonCentroid,
  BuildingFootprint,
} from "./geo-utils";
import { createGunzip } from "zlib";
import { Readable } from "stream";

/**
 * Microsoft Global ML Building Footprints
 * Data is stored as gzipped GeoJSONL files partitioned by quadkey.
 *
 * URL pattern:
 * https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv
 * Each row: Location, QuadKey, URL, Size
 *
 * We skip the CSV index and construct URLs directly since the pattern is known.
 */

const TILE_LEVEL = 9;
const MIN_AREA_SQFT = 100_000;
const MAX_RESULTS_PER_STATE = 50;

// State abbreviation -> full name mapping for bounding boxes
const STATE_BBOXES: Record<
  string,
  { south: number; west: number; north: number; east: number; name: string }
> = {
  TX: { south: 25.84, west: -106.65, north: 36.5, east: -93.51, name: "Texas" },
  AZ: { south: 31.33, west: -114.82, north: 37.0, east: -109.04, name: "Arizona" },
  PA: { south: 39.72, west: -80.52, north: 42.27, east: -74.69, name: "Pennsylvania" },
  CA: { south: 32.53, west: -124.48, north: 42.01, east: -114.13, name: "California" },
  CO: { south: 36.99, west: -109.06, north: 41.0, east: -102.04, name: "Colorado" },
  GA: { south: 30.36, west: -85.61, north: 35.0, east: -80.84, name: "Georgia" },
  IL: { south: 36.97, west: -91.51, north: 42.51, east: -87.02, name: "Illinois" },
  FL: { south: 24.4, west: -87.63, north: 31.0, east: -80.03, name: "Florida" },
  NJ: { south: 38.93, west: -75.56, north: 41.36, east: -73.89, name: "New Jersey" },
  WA: { south: 45.54, west: -124.85, north: 49.0, east: -116.92, name: "Washington" },
};

export interface FetchFootprintsOptions {
  state: string; // 2-letter abbreviation
  bbox?: {
    south: number;
    west: number;
    north: number;
    east: number;
  };
  minAreaSqft?: number;
  maxResults?: number;
}

/**
 * Fetches the dataset-links.csv index from Microsoft and returns
 * all tile URLs for the UnitedStates region matching the given quadkeys.
 */
async function fetchTileUrls(quadkeys: string[]): Promise<Map<string, string>> {
  const indexUrl =
    "https://minedbuildings.z5.web.core.windows.net/global-buildings/dataset-links.csv";

  const response = await fetch(indexUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch dataset index: ${response.status}`);
  }

  const text = await response.text();
  const lines = text.split("\n");

  const quadkeySet = new Set(quadkeys);
  const urlMap = new Map<string, string>();

  for (const line of lines) {
    if (!line.includes("UnitedStates")) continue;
    // CSV format: Location,QuadKey,Url,Size
    const parts = line.split(",");
    if (parts.length < 3) continue;

    const qk = parts[1].trim();
    if (quadkeySet.has(qk)) {
      urlMap.set(qk, parts[2].trim());
    }
  }

  return urlMap;
}

/**
 * Fetches and parses a single gzipped GeoJSONL tile.
 * Each line is a GeoJSON Feature with a Polygon geometry.
 */
async function parseTile(
  url: string,
  bbox: { south: number; west: number; north: number; east: number },
  minArea: number
): Promise<BuildingFootprint[]> {
  const results: BuildingFootprint[] = [];

  const response = await fetch(url);
  if (!response.ok) {
    console.warn(`Failed to fetch tile ${url}: ${response.status}`);
    return results;
  }

  const buffer = await response.arrayBuffer();

  // Decompress gzip
  const decompressed = await new Promise<Buffer>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const gunzip = createGunzip();
    const readable = Readable.from(Buffer.from(buffer));
    readable
      .pipe(gunzip)
      .on("data", (chunk: Buffer) => chunks.push(chunk))
      .on("end", () => resolve(Buffer.concat(chunks)))
      .on("error", reject);
  });

  const text = decompressed.toString("utf-8");
  const lines = text.split("\n");

  for (const line of lines) {
    if (!line.trim()) continue;

    let feature;
    try {
      feature = JSON.parse(line);
    } catch {
      continue;
    }

    if (!feature.geometry || feature.geometry.type !== "Polygon") continue;

    const coords = feature.geometry.coordinates;
    if (!coords || !coords[0] || coords[0].length < 4) continue;

    // Quick centroid check — skip if outside bbox
    const firstCoord = coords[0][0];
    const lon = firstCoord[0];
    const lat = firstCoord[1];
    if (lat < bbox.south || lat > bbox.north || lon < bbox.west || lon > bbox.east) {
      continue;
    }

    // Compute area
    const { sqft, sqm } = polygonAreaSqFt(coords);
    if (sqft < minArea) continue;

    // Compute centroid
    const centroid = polygonCentroid(coords);

    const confidence = feature.properties?.confidence ?? -1;
    const height = feature.properties?.height ?? -1;

    results.push({
      centroid_lat: centroid.lat,
      centroid_lon: centroid.lon,
      area_sqft: Math.round(sqft),
      area_sqm: Math.round(sqm),
      state: "",
      county: "",
      confidence,
      height_m: height,
    });
  }

  return results;
}

/**
 * Main entry point: fetch building footprints for a state/bbox,
 * filter for large buildings, and return top candidates.
 */
export async function fetchBuildingFootprints(
  options: FetchFootprintsOptions
): Promise<{
  buildings: BuildingFootprint[];
  meta: {
    state: string;
    quadkeys_searched: number;
    tiles_fetched: number;
    buildings_scanned: number;
    buildings_returned: number;
  };
}> {
  const {
    state,
    minAreaSqft = MIN_AREA_SQFT,
    maxResults = MAX_RESULTS_PER_STATE,
  } = options;

  const stateInfo = STATE_BBOXES[state.toUpperCase()];
  if (!stateInfo) {
    throw new Error(
      `Unsupported state: ${state}. Supported: ${Object.keys(STATE_BBOXES).join(", ")}`
    );
  }

  // Use provided bbox or fall back to full state bbox
  const bbox = options.bbox ?? stateInfo;

  // Get quadkeys that cover the bounding box
  const quadkeys = bboxToQuadkeys(
    bbox.south,
    bbox.west,
    bbox.north,
    bbox.east,
    TILE_LEVEL
  );

  console.log(
    `[footprints] State: ${state}, BBox: [${bbox.south},${bbox.west},${bbox.north},${bbox.east}]`
  );
  console.log(
    `[footprints] Found ${quadkeys.length} quadkeys at level ${TILE_LEVEL}`
  );

  // Fetch the tile URL index for our quadkeys
  const urlMap = await fetchTileUrls(quadkeys);
  console.log(
    `[footprints] Matched ${urlMap.size} tiles in dataset index`
  );

  // Fetch and parse tiles in parallel (batch of 5 at a time to avoid overwhelming)
  const allBuildings: BuildingFootprint[] = [];
  const entries = Array.from(urlMap.entries());
  const batchSize = 5;

  for (let i = 0; i < entries.length; i += batchSize) {
    const batch = entries.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(([, url]) => parseTile(url, bbox, minAreaSqft))
    );
    for (const results of batchResults) {
      for (const b of results) {
        b.state = state.toUpperCase();
        allBuildings.push(b);
      }
    }
    console.log(
      `[footprints] Processed ${Math.min(i + batchSize, entries.length)}/${entries.length} tiles, found ${allBuildings.length} large buildings so far`
    );
  }

  // Sort by area descending and take top N
  allBuildings.sort((a, b) => b.area_sqft - a.area_sqft);
  const topBuildings = allBuildings.slice(0, maxResults);

  return {
    buildings: topBuildings,
    meta: {
      state: state.toUpperCase(),
      quadkeys_searched: quadkeys.length,
      tiles_fetched: urlMap.size,
      buildings_scanned: allBuildings.length,
      buildings_returned: topBuildings.length,
    },
  };
}

export { STATE_BBOXES };
