/**
 * Holistic Viability Scoring Engine for Grundfos rainwater reuse systems.
 *
 * Combines physical attributes, financial data, resilience metrics,
 * and corporate ESG signals into a 0-100 viability score.
 */

import { getRainfallInches } from "./rainfall";
import { lookupCounty } from "./county-lookup";
import { getFemaNri } from "./fema-nri";

// Water rates per 1000 gallons by state
const waterRates: Record<string, number> = {
  TX: 4.5,
  AZ: 3.8,
  PA: 6.2,
  CA: 7.1,
  FL: 3.9,
  IL: 5.3,
  GA: 4.2,
  WA: 5.8,
  CO: 4.6,
  NJ: 6.8,
};

// States with strong regulatory drivers for rainwater harvesting
const regulatoryStates = new Set(["TX", "AZ", "PA"]);

export interface ViabilityInput {
  roofAreaSqft: number;
  state: string;
  lat: number;
  lon: number;
  coolingTowerDetected: boolean;
  coolingTowerConfidence: number; // 0-1 from MS ML or AI analysis
  esgScore?: number; // 0-1, stub 0.5 default
}

export interface ViabilityResult {
  viabilityScore: number; // 0-100
  annualHarvestGallons: number;
  usableGallons: number;
  annualSavings: number;
  screeningEstimate: true;
  disclaimer: string;
  countyFips: string;
  countyName: string;
  rainfallInches: number;
  breakdown: {
    roofAreaScore: number;
    rainfallHarvestScore: number;
    coolingTowerScore: number;
    waterCostScore: number;
    resilienceScore: number;
    esgScore: number;
    regulatoryScore: number;
  };
  weights: {
    roofArea: 0.25;
    rainfallHarvest: 0.20;
    coolingTower: 0.15;
    waterCost: 0.15;
    resilience: 0.10;
    esg: 0.10;
    regulatory: 0.05;
  };
}

/**
 * Roof area score: 100k=0.3, 300k=0.6, 600k+=1.0
 * Linear interpolation between breakpoints.
 */
function calcRoofAreaScore(sqft: number): number {
  if (sqft >= 600_000) return 1.0;
  if (sqft >= 300_000) return 0.6 + 0.4 * ((sqft - 300_000) / 300_000);
  if (sqft >= 100_000) return 0.3 + 0.3 * ((sqft - 100_000) / 200_000);
  return sqft / 100_000 * 0.3;
}

/**
 * Rainfall harvest score: 5M gallons harvest = 1.0
 */
function calcRainfallHarvestScore(annualHarvestGallons: number): number {
  return Math.min(annualHarvestGallons / 5_000_000, 1.0);
}

/**
 * Water cost score: $7+/1000gal = 1.0
 */
function calcWaterCostScore(state: string): number {
  const rate = waterRates[state] ?? 5.0;
  return Math.min(rate / 7.0, 1.0);
}

/**
 * Regulatory score: 1.0 for TX/AZ/PA, 0.5 for others
 */
function calcRegulatoryScore(state: string): number {
  return regulatoryStates.has(state) ? 1.0 : 0.5;
}

/**
 * Calculate the full viability score for a building candidate.
 * Makes async calls to FCC (county FIPS) and FEMA (risk index).
 */
export async function viabilityScore(
  input: ViabilityInput
): Promise<ViabilityResult> {
  const {
    roofAreaSqft,
    state,
    lat,
    lon,
    coolingTowerDetected,
    coolingTowerConfidence,
    esgScore: inputEsg,
  } = input;

  // Step 1: County lookup for FIPS
  const countyInfo = await lookupCounty(lat, lon);

  // Step 2: Rainfall lookup
  const rainfallInches = getRainfallInches(countyInfo.fips, state);

  // Step 3: FEMA NRI
  const femaNri = await getFemaNri(countyInfo.fips);

  // Step 4: Harvest calculations
  const annualHarvestGallons = roofAreaSqft * rainfallInches * 0.62 * 0.85;

  const utilizationFactor = coolingTowerDetected
    ? 0.25 + 0.55 * coolingTowerConfidence
    : 0.1;

  const usableGallons = annualHarvestGallons * utilizationFactor;

  // Step 5: Financial estimate
  const effectiveRate = (waterRates[state] ?? 5.0) * 1.4;
  const annualSavings = (usableGallons / 1000) * effectiveRate;

  // Step 6: Sub-scores
  const roofAreaScore = calcRoofAreaScore(roofAreaSqft);
  const rainfallHarvestScore = calcRainfallHarvestScore(annualHarvestGallons);
  const coolingTowerScore = coolingTowerDetected ? coolingTowerConfidence : 0;
  const waterCostScore = calcWaterCostScore(state);
  const resilienceScore = femaNri.normalized;
  const esgScoreVal = inputEsg ?? 0.5;
  const regulatoryScore = calcRegulatoryScore(state);

  // Step 7: Weighted composite
  const rawScore =
    0.25 * roofAreaScore +
    0.2 * rainfallHarvestScore +
    0.15 * coolingTowerScore +
    0.15 * waterCostScore +
    0.1 * resilienceScore +
    0.1 * esgScoreVal +
    0.05 * regulatoryScore;

  const finalScore = Math.round(Math.min(Math.max(rawScore * 100, 0), 100));

  return {
    viabilityScore: finalScore,
    annualHarvestGallons: Math.round(annualHarvestGallons),
    usableGallons: Math.round(usableGallons),
    annualSavings: Math.round(annualSavings * 100) / 100,
    screeningEstimate: true,
    disclaimer:
      "Screening estimate only. Final yield requires site engineering.",
    countyFips: countyInfo.fips,
    countyName: countyInfo.countyName,
    rainfallInches,
    breakdown: {
      roofAreaScore: Math.round(roofAreaScore * 1000) / 1000,
      rainfallHarvestScore: Math.round(rainfallHarvestScore * 1000) / 1000,
      coolingTowerScore: Math.round(coolingTowerScore * 1000) / 1000,
      waterCostScore: Math.round(waterCostScore * 1000) / 1000,
      resilienceScore: Math.round(resilienceScore * 1000) / 1000,
      esgScore: Math.round(esgScoreVal * 1000) / 1000,
      regulatoryScore,
    },
    weights: {
      roofArea: 0.25,
      rainfallHarvest: 0.2,
      coolingTower: 0.15,
      waterCost: 0.15,
      resilience: 0.1,
      esg: 0.1,
      regulatory: 0.05,
    },
  };
}
