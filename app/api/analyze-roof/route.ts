import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

interface RoofAnalysis {
  coolingTowerDetected: boolean;
  coolingTowerConfidence: number;
  estimatedTowerCount: number;
  roofCondition: "excellent" | "good" | "fair" | "poor";
  roofMaterial: string;
  notes: string;
}

interface AnalyzeResult {
  buildingId: string;
  lat: number;
  lon: number;
  analysis: RoofAnalysis;
  source: "ai" | "mock";
  imageUrl: string | null;
}

// In-memory cache by buildingId
const cache = new Map<string, AnalyzeResult>();

/**
 * Generate a deterministic mock analysis based on lat/lon.
 * Used when MAPBOX_TOKEN or ANTHROPIC_API_KEY is not set.
 */
function mockAnalysis(lat: number, lon: number): RoofAnalysis {
  // Use coordinate digits to create varied but deterministic results
  const seed = Math.floor(Math.abs(lat * 1000 + lon * 100) % 100);
  const detected = seed > 35;
  const confidence = detected
    ? 0.55 + (seed % 45) / 100
    : 0;

  const conditions: RoofAnalysis["roofCondition"][] = [
    "excellent",
    "good",
    "good",
    "fair",
  ];
  const materials = [
    "TPO membrane",
    "EPDM rubber",
    "Metal standing seam",
    "Built-up roofing (BUR)",
    "Modified bitumen",
  ];

  return {
    coolingTowerDetected: detected,
    coolingTowerConfidence: Math.round(confidence * 100) / 100,
    estimatedTowerCount: detected ? 1 + (seed % 4) : 0,
    roofCondition: conditions[seed % conditions.length],
    roofMaterial: materials[seed % materials.length],
    notes: detected
      ? `Mock analysis: ${1 + (seed % 4)} cooling tower unit(s) visible on rooftop. Flat commercial roof suitable for rainwater collection.`
      : "Mock analysis: No cooling towers detected. Flat commercial roof suitable for rainwater collection.",
  };
}

export async function POST(request: NextRequest) {
  let body: { lat?: number; lon?: number; buildingId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON. Expected: { lat, lon, buildingId }" },
      { status: 400 }
    );
  }

  const { lat, lon, buildingId } = body;
  if (lat == null || lon == null || !buildingId) {
    return NextResponse.json(
      { error: "Missing required fields: lat, lon, buildingId" },
      { status: 400 }
    );
  }

  // Check cache
  const cached = cache.get(buildingId);
  if (cached) {
    return NextResponse.json({ ...cached, cached: true });
  }

  const mapboxToken = process.env.MAPBOX_TOKEN;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  // If either key is missing, return mock
  if (!mapboxToken || !anthropicKey) {
    const analysis = mockAnalysis(lat, lon);
    const result: AnalyzeResult = {
      buildingId,
      lat,
      lon,
      analysis,
      source: "mock",
      imageUrl: null,
    };
    cache.set(buildingId, result);

    return NextResponse.json({
      ...result,
      cached: false,
      note: !mapboxToken
        ? "Set MAPBOX_TOKEN env var for real satellite imagery"
        : "Set ANTHROPIC_API_KEY env var for AI analysis",
    });
  }

  try {
    // Step 1: Fetch satellite image from Mapbox
    const imageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${lon},${lat},18,0/400x400?access_token=${mapboxToken}`;

    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Mapbox returned ${imageResponse.status}`);
    }

    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString("base64");
    const mediaType = "image/jpeg";

    // Step 2: Send to Claude for analysis
    const claudeResponse = await fetch(
      "https://api.anthropic.com/v1/messages",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1024,
          system:
            "You are a satellite imagery analyst for water infrastructure. You analyze commercial rooftop images to detect cooling towers and assess roof conditions for rainwater harvesting systems.",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: {
                    type: "base64",
                    media_type: mediaType,
                    data: base64Image,
                  },
                },
                {
                  type: "text",
                  text: `Analyze this commercial rooftop satellite image. Return JSON only, no markdown fences or extra text:
{
  "coolingTowerDetected": boolean,
  "coolingTowerConfidence": 0.0-1.0,
  "estimatedTowerCount": number,
  "roofCondition": "excellent"|"good"|"fair"|"poor",
  "roofMaterial": string,
  "notes": string
}`,
                },
              ],
            },
          ],
        }),
      }
    );

    if (!claudeResponse.ok) {
      const errText = await claudeResponse.text();
      throw new Error(`Anthropic API error ${claudeResponse.status}: ${errText}`);
    }

    const claudeData = await claudeResponse.json();
    const responseText =
      claudeData.content?.[0]?.text || "{}";

    // Parse the JSON from Claude's response
    let analysis: RoofAnalysis;
    try {
      // Strip markdown fences if present
      const cleaned = responseText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analysis = JSON.parse(cleaned);
    } catch {
      console.warn(
        "[analyze-roof] Failed to parse Claude response, using mock:",
        responseText
      );
      analysis = mockAnalysis(lat, lon);
    }

    const result: AnalyzeResult = {
      buildingId,
      lat,
      lon,
      analysis,
      source: "ai",
      imageUrl: imageUrl.replace(mapboxToken, "REDACTED"),
    };

    cache.set(buildingId, result);
    return NextResponse.json({ ...result, cached: false });
  } catch (error) {
    console.error("[analyze-roof]", error);

    // Fallback to mock on error
    const analysis = mockAnalysis(lat, lon);
    const result: AnalyzeResult = {
      buildingId,
      lat,
      lon,
      analysis,
      source: "mock",
      imageUrl: null,
    };
    cache.set(buildingId, result);

    return NextResponse.json({
      ...result,
      cached: false,
      error: error instanceof Error ? error.message : "Analysis failed",
    });
  }
}
