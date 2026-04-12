import { NextRequest, NextResponse } from "next/server";
import {
  fetchBuildingFootprints,
  STATE_BBOXES,
} from "@/lib/building-footprints";
import { viabilityScore } from "@/lib/viability";

export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");

  if (!state) {
    return NextResponse.json(
      {
        error: "Missing required parameter: state (2-letter abbreviation)",
        supported: Object.keys(STATE_BBOXES),
      },
      { status: 400 }
    );
  }

  const stateUpper = state.toUpperCase();
  if (!STATE_BBOXES[stateUpper]) {
    return NextResponse.json(
      {
        error: `Unsupported state: ${state}`,
        supported: Object.keys(STATE_BBOXES),
      },
      { status: 400 }
    );
  }

  // Optional bbox override
  const south = searchParams.get("south");
  const west = searchParams.get("west");
  const north = searchParams.get("north");
  const east = searchParams.get("east");

  const bbox =
    south && west && north && east
      ? {
          south: parseFloat(south),
          west: parseFloat(west),
          north: parseFloat(north),
          east: parseFloat(east),
        }
      : undefined;

  const minArea = searchParams.get("min_area_sqft");
  const maxResults = searchParams.get("max_results");
  const skipScoring = searchParams.get("skip_scoring") === "true";

  try {
    const result = await fetchBuildingFootprints({
      state: stateUpper,
      bbox,
      minAreaSqft: minArea ? parseInt(minArea, 10) : undefined,
      maxResults: maxResults ? parseInt(maxResults, 10) : undefined,
    });

    if (skipScoring) {
      return NextResponse.json(result);
    }

    // Run viability scoring on each building
    const scoredBuildings = await Promise.all(
      result.buildings.map(async (b) => {
        const score = await viabilityScore({
          roofAreaSqft: b.area_sqft,
          state: stateUpper,
          lat: b.centroid_lat,
          lon: b.centroid_lon,
          coolingTowerDetected: b.confidence > 0.7,
          coolingTowerConfidence: b.confidence > 0 ? b.confidence : 0,
        });

        return {
          ...b,
          viability: score,
        };
      })
    );

    // Re-sort by viability score descending
    scoredBuildings.sort(
      (a, b) => b.viability.viabilityScore - a.viability.viabilityScore
    );

    return NextResponse.json({
      buildings: scoredBuildings,
      meta: result.meta,
    });
  } catch (error) {
    console.error("[footprints API]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
