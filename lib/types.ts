// --- Types matching the real /api/scan-state response ---

export interface ViabilityBreakdown {
  roofAreaScore: number;
  rainfallHarvestScore: number;
  coolingTowerScore: number;
  waterCostScore: number;
  resilienceScore: number;
  esgScore: number;
  regulatoryScore: number;
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
  breakdown: ViabilityBreakdown;
  weights: {
    roofArea: number;
    rainfallHarvest: number;
    coolingTower: number;
    waterCost: number;
    resilience: number;
    esg: number;
    regulatory: number;
  };
}

export interface ScoredCandidate {
  centroid_lat: number;
  centroid_lon: number;
  area_sqft: number;
  area_sqm: number;
  state: string;
  county: string;
  confidence: number;
  height_m: number;
  viability: ViabilityResult;
}

export interface ScanStateResponse {
  candidates: ScoredCandidate[];
  scanStatus: {
    tilesTotal: number;
    tilesFetched: number;
    buildingsScanned: number;
    candidatesScored: number;
    candidatesReturned: number;
  };
  state: string;
  timestamp: string;
}

export type StateOption = {
  value: string;
  label: string;
};

export type SortField =
  | "viabilityScore"
  | "area_sqft"
  | "annualSavings"
  | "coolingTowerConfidence";
