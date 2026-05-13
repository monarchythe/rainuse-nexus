import { NextRequest } from "next/server";
import { fetchBuildingFootprintsStream, STATE_BBOXES, FetchFootprintsOptions } from "@/lib/building-footprints";
import { viabilityScore } from "@/lib/viability";
import { ScoredCandidate, ScanStateResponse } from "@/lib/types";

export const maxDuration = 120;

const cache = new Map<string, { data: ScanStateResponse; cachedAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000;

const enc = (obj: unknown) => JSON.stringify(obj) + "\n";

export async function POST(request: NextRequest) {
  let body: {
    state?: string;
    city?: string;
    bbox?: [number, number, number, number];
    maxResults?: number;
  };
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON body. Expected: { state: "TX", city: "Houston" }' }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const state = body.state?.toUpperCase();
  if (!state || !STATE_BBOXES[state]) {
    return new Response(
      JSON.stringify({
        error: `Missing or unsupported state. Supported: ${Object.keys(STATE_BBOXES).join(", ")}`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const city = body.city;
  const bbox = body.bbox;
  const maxResults = body.maxResults ?? 25;
  const cacheKey = city ? `${state}-${city}` : state;

  // Cache hit — return instantly as plain JSON
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    console.log(`[scan-state] Cache hit for ${cacheKey}`);
    return new Response(JSON.stringify(cached.data), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Build stream options — use city bbox when provided
  const streamOptions: Omit<FetchFootprintsOptions, "maxResults"> = {
    state,
    minAreaSqft: 100_000,
  };
  if (bbox) {
    streamOptions.bbox = {
      south: bbox[0],
      west: bbox[1],
      north: bbox[2],
      east: bbox[3],
    };
  }

  // Cache miss — pipeline: score each tile batch as it arrives, stream candidates immediately
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (obj: unknown) =>
        controller.enqueue(new TextEncoder().encode(enc(obj)));

      try {
        console.log(`[scan-state] Starting pipelined scan for ${cacheKey}`);

        const allScored: ScoredCandidate[] = [];
        let scanMeta = { tilesTotal: 0, tilesMatched: 0 };

        for await (const event of fetchBuildingFootprintsStream(streamOptions)) {
          if (event.kind === "meta") {
            scanMeta = { tilesTotal: event.tilesTotal, tilesMatched: event.tilesMatched };
            enqueue({ type: "meta", total: 0 });
          } else if (event.kind === "batch" && event.buildings.length > 0) {
            // Score this tile batch immediately — don't wait for remaining tiles
            const scoringBatchSize = 10;
            for (let i = 0; i < event.buildings.length; i += scoringBatchSize) {
              const chunk = event.buildings.slice(i, i + scoringBatchSize);
              const scored = await Promise.all(
                chunk.map(async (b) => {
                  const score = await viabilityScore({
                    roofAreaSqft: b.area_sqft,
                    state,
                    lat: b.centroid_lat,
                    lon: b.centroid_lon,
                    coolingTowerDetected: b.confidence > 0.7,
                    coolingTowerConfidence: b.confidence > 0 ? b.confidence : 0,
                  });
                  return { ...b, viability: score } as ScoredCandidate;
                })
              );

              for (const candidate of scored) {
                allScored.push(candidate);
                enqueue({ type: "candidate", data: candidate });
              }
            }

            console.log(
              `[scan-state] Tile batch ${event.tilesDone}/${scanMeta.tilesMatched}: ` +
              `scored ${event.buildings.length} buildings, running total: ${allScored.length}`
            );
          }
        }

        allScored.sort((a, b) => b.viability.viabilityScore - a.viability.viabilityScore);
        const topCandidates = allScored.slice(0, maxResults);

        const scanStatus = {
          tilesTotal: scanMeta.tilesTotal,
          tilesFetched: scanMeta.tilesMatched,
          buildingsScanned: allScored.length,
          candidatesScored: allScored.length,
          candidatesReturned: topCandidates.length,
        };

        const timestamp = new Date().toISOString();
        enqueue({ type: "done", topCandidates, scanStatus, state, timestamp });

        cache.set(cacheKey, {
          data: { candidates: topCandidates, scanStatus, state, timestamp },
          cachedAt: Date.now(),
        });
      } catch (error) {
        console.error("[scan-state]", error);
        enqueue({
          type: "error",
          error: error instanceof Error ? error.message : "Internal error",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Cache-Control": "no-cache",
    },
  });
}
