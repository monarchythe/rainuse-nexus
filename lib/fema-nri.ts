/**
 * FEMA National Risk Index (NRI) API module.
 * Fetches county-level risk data for flood and drought hazards.
 *
 * API: https://hazards.fema.gov/nri/api/county/{FIPS}
 */

export interface FemaNriData {
  riskScore: number; // Overall risk score
  floodRisk: number; // Coastal flooding risk score
  droughtRisk: number; // Drought risk score
  expectedAnnualLoss: number; // Expected annual loss - building value
  normalized: number; // 0-1 normalized resilience score
  source: "api" | "default";
}

// In-memory cache keyed by county FIPS
const cache = new Map<string, FemaNriData>();

/**
 * Normalize a FEMA risk score to 0-1.
 * FEMA scores range roughly 0-100, with higher = more risk.
 * We invert so higher = more resilience need = more value for water systems.
 */
function normalizeRiskScore(
  riskScore: number,
  floodRisk: number,
  droughtRisk: number
): number {
  // Combine: flood risk drives stormwater management need,
  // drought risk drives water conservation value
  const floodNorm = Math.min(floodRisk / 50, 1);
  const droughtNorm = Math.min(droughtRisk / 50, 1);
  const overallNorm = Math.min(riskScore / 50, 1);

  // Weighted: drought and flood are more relevant than overall
  return Math.min(
    floodNorm * 0.35 + droughtNorm * 0.35 + overallNorm * 0.3,
    1
  );
}

/**
 * Fetch FEMA NRI data for a county FIPS code.
 * Caches results. Returns default (0.5) if API fails.
 */
export async function getFemaNri(countyFips: string): Promise<FemaNriData> {
  const cached = cache.get(countyFips);
  if (cached) return cached;

  try {
    const url = `https://hazards.fema.gov/nri/api/county/${countyFips}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      throw new Error(`FEMA API returned ${response.status}`);
    }

    const data = await response.json();

    // Extract fields — FEMA returns an array of results
    const record = Array.isArray(data) ? data[0] : data;

    const riskScore = record?.RISK_SCORE ?? 0;
    const floodRisk = record?.CFLD_RISKS ?? 0;
    const droughtRisk = record?.DRGT_RISKS ?? 0;
    const ealValt = record?.EAL_VALT ?? 0;

    const result: FemaNriData = {
      riskScore,
      floodRisk,
      droughtRisk,
      expectedAnnualLoss: ealValt,
      normalized: normalizeRiskScore(riskScore, floodRisk, droughtRisk),
      source: "api",
    };

    cache.set(countyFips, result);
    return result;
  } catch (error) {
    console.warn(
      `[fema-nri] Failed for FIPS ${countyFips}:`,
      error instanceof Error ? error.message : error
    );

    const fallback: FemaNriData = {
      riskScore: 0,
      floodRisk: 0,
      droughtRisk: 0,
      expectedAnnualLoss: 0,
      normalized: 0.5,
      source: "default",
    };

    cache.set(countyFips, fallback);
    return fallback;
  }
}

export function clearFemaCache(): void {
  cache.clear();
}
