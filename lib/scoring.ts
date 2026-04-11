/**
 * Calculates the viability score for a building based on weighted factors.
 * Score range: 0–100
 */
export function calculateViabilityScore(params: {
  roof_area_sqft: number;
  cooling_tower_confidence: number;
  rainfall_inches: number;
  water_cost_index: number;
  esg_signal: "strong" | "moderate" | "weak" | "none";
  stormwater_fee: boolean;
  tax_incentive: boolean;
}): number {
  const {
    roof_area_sqft,
    cooling_tower_confidence,
    rainfall_inches,
    water_cost_index,
    esg_signal,
    stormwater_fee,
    tax_incentive,
  } = params;

  // Roof area score (25%) — bonus for >100k sqft
  const roofScore = Math.min(roof_area_sqft / 200_000, 1) * 100;

  // Cooling tower confidence (15%)
  const coolingScore = cooling_tower_confidence;

  // Rainfall potential (20%) — based on inches per year
  const rainfallScore = Math.min(rainfall_inches / 50, 1) * 100;

  // Water cost index (20%) — higher cost = more ROI
  const waterCostScore = (water_cost_index / 10) * 100;

  // ESG signal (10%)
  const esgMap = { strong: 100, moderate: 70, weak: 40, none: 10 };
  const esgScore = esgMap[esg_signal];

  // Regulatory bonus (10%)
  let regulatoryScore = 0;
  if (stormwater_fee) regulatoryScore += 50;
  if (tax_incentive) regulatoryScore += 50;

  const weighted =
    roofScore * 0.25 +
    coolingScore * 0.15 +
    rainfallScore * 0.2 +
    waterCostScore * 0.2 +
    esgScore * 0.1 +
    regulatoryScore * 0.1;

  return Math.round(Math.min(Math.max(weighted, 0), 100));
}

/**
 * Estimates annual rainwater capture in gallons.
 * Formula: roof_area_sqft × rainfall_inches × 0.623 (gallons per sqft per inch)
 */
export function estimateGallonsPerYear(
  roof_area_sqft: number,
  rainfall_inches: number
): number {
  return Math.round(roof_area_sqft * rainfall_inches * 0.623);
}

/**
 * Estimates annual savings based on captured water and local cost index.
 * Uses average water cost of $0.006/gallon scaled by cost index.
 */
export function estimateSavingsPerYear(
  gallons: number,
  water_cost_index: number
): number {
  const baseCostPerGallon = 0.006;
  const scaledCost = baseCostPerGallon * (water_cost_index / 5);
  return Math.round(gallons * scaledCost);
}
