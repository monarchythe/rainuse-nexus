import { NextRequest, NextResponse } from "next/server";
import {
  fetchBuildingFootprints,
  STATE_BBOXES,
} from "@/lib/building-footprints";
import { viabilityScore, ViabilityResult } from "@/lib/viability";
import { BuildingFootprint } from "@/lib/geo-utils";

export const maxDuration = 120;

interface ScoredBuilding extends BuildingFootprint {
  viability: ViabilityResult;
}

export async function POST(request: NextRequest) {
  let body: { state?: string; maxResults?: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body. Expected: { state: \"TX\" }" },
      { status: 400 }
    );
  }

  const state = body.state?.toUpperCase();
  if (!state || !STATE_BBOXES[state]) {
    return NextResponse.json(
      {
        error: `Missing or unsupported state. Supported: ${Object.keys(STATE_BBOXES).join(", ")}`,
      },
      { status: 400 }
    );
  }

  const maxResults = body.maxResults ?? 25;

  try {
    console.log(`[scan-state] Starting full scan for ${state}`);

    // Step 1: Fetch all large buildings across the entire state
    const result = await fetchBuildingFootprints({
      state,
      minAreaSqft: 100_000,
      // Fetch more than maxResults so we can re-rank by viability
      maxResults: maxResults * 4,
    });

    console.log(
      `[scan-state] Found ${result.buildings.length} candidates, running viability scoring...`
    );

    // Step 2: Score each building
    // Process in batches of 10 to avoid overwhelming FCC/FEMA APIs
    const scored: ScoredBuilding[] = [];
    const batchSize = 10;

    for (let i = 0; i < result.buildings.length; i += batchSize) {
      const batch = result.buildings.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map(async (b) => {
          const score = await viabilityScore({
            roofAreaSqft: b.area_sqft,
            state,
            lat: b.centroid_lat,
            lon: b.centroid_lon,
            coolingTowerDetected: b.confidence > 0.7,
            coolingTowerConfidence: b.confidence > 0 ? b.confidence : 0,
          });

          return { ...b, viability: score } as ScoredBuilding;
        })
      );

      scored.push(...batchResults);

      console.log(
        `[scan-state] Scored ${Math.min(i + batchSize, result.buildings.length)}/${result.buildings.length} buildings`
      );
    }

    // Step 3: Sort by viability score and take top N
    scored.sort(
      (a, b) => b.viability.viabilityScore - a.viability.viabilityScore
    );
    const topCandidates = scored.slice(0, maxResults);

    return NextResponse.json({
      candidates: topCandidates,
      scanStatus: {
        tilesTotal: result.meta.quadkeys_searched,
        tilesFetched: result.meta.tiles_fetched,
        buildingsScanned: result.meta.buildings_scanned,
        candidatesScored: scored.length,
        candidatesReturned: topCandidates.length,
      },
      state,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[scan-state]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error" },
      { status: 500 }
    );
  }
}
