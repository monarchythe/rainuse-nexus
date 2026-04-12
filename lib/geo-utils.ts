import turfArea from "@turf/area";
import turfCentroid from "@turf/centroid";
import { polygon as turfPolygon } from "@turf/helpers";

export interface BuildingFootprint {
  centroid_lat: number;
  centroid_lon: number;
  area_sqft: number;
  area_sqm: number;
  state: string;
  county: string;
  confidence: number;
  height_m: number;
}

/**
 * Compute the area of a GeoJSON polygon in square meters and square feet.
 * Uses @turf/area for geodesic accuracy.
 */
export function polygonAreaSqFt(
  coordinates: number[][][]
): { sqm: number; sqft: number } {
  const poly = turfPolygon(coordinates);
  const sqm = turfArea(poly);
  const sqft = sqm * 10.7639; // 1 sqm = 10.7639 sqft
  return { sqm, sqft };
}

/**
 * Compute the centroid of a GeoJSON polygon.
 * Returns [lon, lat].
 */
export function polygonCentroid(coordinates: number[][][]): {
  lat: number;
  lon: number;
} {
  const poly = turfPolygon(coordinates);
  const center = turfCentroid(poly);
  const [lon, lat] = center.geometry.coordinates;
  return { lat, lon };
}
