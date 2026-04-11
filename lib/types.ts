export interface Building {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
  type: "commercial" | "industrial" | "data-center" | "warehouse";
  roof_area_sqft: number;
  cooling_tower_confidence: number; // 0-100
  rainfall_inches: number;
  water_cost_index: number; // 1-10 scale
  esg_signal: "strong" | "moderate" | "weak" | "none";
  viability_score: number; // 0-100, computed
  estimated_gallons_year: number;
  estimated_savings_year: number;
  stormwater_fee: boolean;
  tax_incentive: boolean;
  leed_certified: boolean;
}

export type StateOption = {
  value: string;
  label: string;
};

export type SortField =
  | "viability_score"
  | "roof_area_sqft"
  | "estimated_savings_year"
  | "cooling_tower_confidence";
