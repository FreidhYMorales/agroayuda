// web/src/api/site.ts
import type { ErrorResponse, SiteProfile } from "../contracts/contracts";
import { requestJson } from "./client";

export type SiteResult =
  | { ok: true; site: SiteProfile }
  | { ok: false; error: ErrorResponse["error"] | "network" };

export async function getSite(
  lat: number,
  lon: number,
  opts: { signal: AbortSignal; onSlow: () => void },
): Promise<SiteResult> {
  const query = new URLSearchParams({ lat: String(lat), lon: String(lon) });
  const result = await requestJson<SiteProfile>(`/site?${query.toString()}`, opts);

  if (result.ok) {
    return { ok: true, site: result.data };
  }
  return { ok: false, error: result.error };
}
