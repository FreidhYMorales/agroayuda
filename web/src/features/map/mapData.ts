// web/src/features/map/mapData.ts
import { isAbortError } from "../../api/client";
import type { Polygon } from "../../contracts/contracts";
import type { RainCollection } from "./rainLayer";

// Static files served by Vercel from web/public/data (not by the API).
const RAIN_URL = "/data/layers/rain.geojson";
const REGION_URL = "/data/region.geojson";
const MASK_URL = "/data/region_mask.geojson";

// The region file has one polygon per department (El Progreso, Zacapa,
// Chiquimula, Jalapa and Jutiapa), not a single merged outline.
export interface RegionCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: Polygon;
    properties: { shapeName: string; shapeISO: string };
  }[];
}

// One feature: a world ring with the region as holes, to dim the area outside it.
export interface MaskCollection {
  type: "FeatureCollection";
  features: { type: "Feature"; geometry: Polygon; properties: Record<string, never> }[];
}

export interface MapData {
  rain: RainCollection;
  region: RegionCollection;
  // Null when the mask file is missing or unusable; the map works without it.
  mask: MaskCollection | null;
}

export type MapDataResult = { ok: true; data: MapData } | { ok: false };

function isFeatureCollection(body: unknown): boolean {
  if (typeof body !== "object" || body === null) return false;
  const candidate = body as { type?: unknown; features?: unknown };
  return candidate.type === "FeatureCollection" && Array.isArray(candidate.features);
}

// Returns undefined for any answer that is not a usable GeoJSON collection.
async function fetchCollection<T>(url: string, signal: AbortSignal): Promise<T | undefined> {
  const response = await fetch(url, { signal });
  if (!response.ok) return undefined;
  const body: unknown = await response.json();
  return isFeatureCollection(body) ? (body as T) : undefined;
}

// The mask is decorative: any failure except an abort means "no mask".
async function fetchOptionalMask(signal: AbortSignal): Promise<MaskCollection | null> {
  try {
    return (await fetchCollection<MaskCollection>(MASK_URL, signal)) ?? null;
  } catch (error) {
    if (isAbortError(error)) throw error;
    return null;
  }
}

export async function loadMapData(options: { signal: AbortSignal }): Promise<MapDataResult> {
  try {
    const [rain, region, mask] = await Promise.all([
      fetchCollection<RainCollection>(RAIN_URL, options.signal),
      fetchCollection<RegionCollection>(REGION_URL, options.signal),
      fetchOptionalMask(options.signal),
    ]);
    if (rain === undefined || region === undefined) return { ok: false };
    return { ok: true, data: { rain, region, mask } };
  } catch (error) {
    // An abort means a newer load replaced this one: the caller ignores it.
    if (isAbortError(error)) throw error;
    // Network failures and invalid JSON are the same for the farmer: no map data.
    return { ok: false };
  }
}
