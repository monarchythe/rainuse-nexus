/**
 * NOAA 1991-2020 Climate Normals — annual precipitation by county FIPS.
 * Source: https://www.ncei.noaa.gov/products/land-based-station/us-climate-normals
 */

const countyRainfall: Record<string, number> = {
  "48201": 49.8, // Harris TX (Houston)
  "48113": 37.6, // Dallas TX
  "48453": 34.0, // Travis TX (Austin)
  "48029": 30.5, // Bexar TX (San Antonio)
  "48439": 36.1, // Tarrant TX (Fort Worth)
  "04013": 7.9, // Maricopa AZ (Phoenix)
  "04019": 11.6, // Pima AZ (Tucson)
  "42101": 45.7, // Philadelphia PA
  "42003": 38.2, // Allegheny PA (Pittsburgh)
  "06037": 15.1, // Los Angeles CA
  "12086": 61.9, // Miami-Dade FL
  "17031": 38.0, // Cook IL (Chicago)
  "13121": 50.2, // Fulton GA (Atlanta)
  "53033": 38.4, // King WA (Seattle)
};

const stateRainfallFallback: Record<string, number> = {
  TX: 31,
  AZ: 13,
  PA: 42,
  CA: 20,
  FL: 54,
  IL: 38,
  GA: 50,
  WA: 38,
  CO: 17,
  NJ: 47,
};

/**
 * Look up annual rainfall in inches for a county FIPS code.
 * Falls back to state average, then US average of 30 inches.
 */
export function getRainfallInches(countyFips: string, state: string): number {
  if (countyRainfall[countyFips]) {
    return countyRainfall[countyFips];
  }
  if (stateRainfallFallback[state]) {
    return stateRainfallFallback[state];
  }
  return 30; // US national average fallback
}

export { countyRainfall, stateRainfallFallback };
