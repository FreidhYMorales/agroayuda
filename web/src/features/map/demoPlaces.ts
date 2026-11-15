// web/src/features/map/demoPlaces.ts
import { isAbortError } from "../../api/client";
import type { DemoPoint } from "../../contracts/contracts";

// Static file served by Vercel from web/public/data (not by the API).
const DEMO_POINTS_URL = "/data/demo_points.json";

export type DemoPlacesResult = { ok: true; places: DemoPoint[] } | { ok: false };

// The places list is the alternative to the map, so a malformed item must
// fail the whole load instead of crashing the screen later.
function isDemoPoint(value: unknown): value is DemoPoint {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as { id?: unknown; name_es?: unknown; location?: unknown };
  if (typeof candidate.id !== "string" || typeof candidate.name_es !== "string") return false;

  if (typeof candidate.location !== "object" || candidate.location === null) return false;
  const location = candidate.location as { lat?: unknown; lon?: unknown };
  return typeof location.lat === "number" && typeof location.lon === "number";
}

export async function loadDemoPlaces(options: { signal: AbortSignal }): Promise<DemoPlacesResult> {
  try {
    const response = await fetch(DEMO_POINTS_URL, { signal: options.signal });
    if (!response.ok) return { ok: false };

    const body: unknown = await response.json();
    if (!Array.isArray(body) || !body.every(isDemoPoint)) return { ok: false };
    return { ok: true, places: body };
  } catch (error) {
    // An abort means a newer load replaced this one: the caller ignores it.
    if (isAbortError(error)) throw error;
    // Network failures and invalid JSON are the same for the farmer: no list.
    return { ok: false };
  }
}
