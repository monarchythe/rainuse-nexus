import { NextRequest, NextResponse } from "next/server";

// Cache stores string (address) or null (geocoding returned nothing / failed)
const cache = new Map<string, string | null>();

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");

  if (!lat || !lon) {
    return NextResponse.json({ address: null }, { status: 400 });
  }

  const cacheKey = `${Number(lat).toFixed(5)},${Number(lon).toFixed(5)}`;

  if (cache.has(cacheKey)) {
    return NextResponse.json({ address: cache.get(cacheKey) ?? null });
  }

  const token = process.env.MAPBOX_TOKEN;
  if (!token) {
    cache.set(cacheKey, null);
    return NextResponse.json({ address: null });
  }

  try {
    const url =
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json` +
      `?access_token=${token}&limit=1`;

    const response = await fetch(url);
    if (!response.ok) {
      cache.set(cacheKey, null);
      return NextResponse.json({ address: null });
    }

    const data = await response.json();
    const feature = data.features?.[0];

    // Take the first segment before a comma — gives "1234 Main St" or a POI name
    const address: string | null = feature?.place_name
      ? (feature.place_name as string).split(",")[0].trim()
      : null;

    cache.set(cacheKey, address);
    return NextResponse.json({ address });
  } catch {
    cache.set(cacheKey, null);
    return NextResponse.json({ address: null });
  }
}
