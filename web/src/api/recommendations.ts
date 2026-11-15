/**
 * POST /recommendations. Built on the lead's `requestJson`:
 * - never throws for HTTP or network errors (`{ ok: false, error }`);
 * - rethrows aborts: a newer request replaced this one, so the caller ignores them
 *   (check with `isAbortError`);
 * - calls `onSlow` once if there is no answer after 5 s (the free server is waking up).
 */
import type {
  ErrorResponse,
  RecommendationRequest,
  RecommendationResponse,
} from "../contracts/contracts";
import { requestJson } from "./client";

export type RecResult =
  | { ok: true; data: RecommendationResponse }
  | { ok: false; error: ErrorResponse["error"] | "network" };

export async function postRecommendations(
  req: RecommendationRequest,
  opts: { signal: AbortSignal; onSlow: () => void },
): Promise<RecResult> {
  return requestJson<RecommendationResponse>("/recommendations", {
    method: "POST",
    body: req,
    signal: opts.signal,
    onSlow: opts.onSlow,
  });
}
