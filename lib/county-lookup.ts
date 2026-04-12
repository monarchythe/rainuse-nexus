/**
 * County FIPS lookup via FCC Census Block API.
 * https://geo.fcc.gov/api/census/block/find
 *
 * Caches results by lat/lon rounded to 2 decimal places.
 */

interface CountyInfo {
  fips: string; // 5-digit county FIPS
  countyName: string;
  stateCode: string;
  stateFips: string;
}

// In-memory cache keyed by "lat,lon" rounded to 2 decimals
const cache = new Map<string, CountyInfo>();

function cacheKey(lat: number, lon: number): string {
  return `${lat.toFixed(2)},${lon.toFixed(2)}`;
}

/**
 * Look up county FIPS for a lat/lon coordinate.
 * Uses FCC's free geocoding API — no key required.
 */
export async function lookupCounty(
  lat: number,
  lon: number
): Promise<CountyInfo> {
  const key = cacheKey(lat, lon);
  const cached = cache.get(key);
  if (cached) return cached;

  try {
    const url = `https://geo.fcc.gov/api/census/block/find?latitude=${lat}&longitude=${lon}&format=json`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`FCC API returned ${response.status}`);
    }

    const data = await response.json();
    const county = data.County;
    const state = data.State;

    if (!county || !county.FIPS) {
      throw new Error("No county data in FCC response");
    }

    const info: CountyInfo = {
      fips: county.FIPS,
      countyName: county.name || "",
      stateCode: state?.code || "",
      stateFips: state?.FIPS || "",
    };

    cache.set(key, info);
    return info;
  } catch (error) {
    console.warn(
      `[county-lookup] Failed for (${lat}, ${lon}):`,
      error instanceof Error ? error.message : error
    );
    // Return a default so pipeline doesn't break
    return {
      fips: "00000",
      countyName: "Unknown",
      stateCode: "",
      stateFips: "",
    };
  }
}

/** Clear the cache (useful for testing). */
export function clearCountyCache(): void {
  cache.clear();
}
