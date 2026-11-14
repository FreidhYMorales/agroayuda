/**
 * Typed fetch wrapper for the AgroAyuda API. Feature modules build on it
 * (e.g. `getSite` in site.ts, `postRecommendations` in recommendations.ts).
 *
 * - Never throws for HTTP or network errors: returns `{ ok: false, error }`.
 * - Rethrows aborts: a newer request replaced this one, so the caller ignores it
 *   (check with `isAbortError`).
 * - Calls `onSlow` once if there is no answer after SLOW_MS (Render waking up).
 */
import type { ErrorResponse } from "../contracts/contracts";

export type ApiError = ErrorResponse["error"] | "network";
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

export type RequestOptions = {
  signal: AbortSignal;
  onSlow: () => void;
  method?: "GET" | "POST";
  body?: unknown;
};

export const SLOW_MS = 5000;

const ERROR_CODES: readonly ErrorResponse["error"][] = [
  "outside_region",
  "invalid_request",
  "not_found",
  "internal",
];

export function apiBaseUrl(): string {
  return import.meta.env.VITE_API_URL ?? "http://localhost:8000";
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function isErrorResponse(body: unknown): body is ErrorResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "error" in body &&
    ERROR_CODES.includes((body as { error: ErrorResponse["error"] }).error)
  );
}

function errorFromStatus(status: number): ErrorResponse["error"] {
  if (status === 404) return "not_found";
  if (status === 422) return "invalid_request";
  return "internal";
}

export async function requestJson<T>(path: string, options: RequestOptions): Promise<ApiResult<T>> {
  const { signal, onSlow, method = "GET", body } = options;
  const slowTimer = setTimeout(onSlow, SLOW_MS);
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, {
      method,
      signal,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const parsed: unknown = await response.json().catch(() => undefined);
    if (response.ok) {
      return { ok: true, data: parsed as T };
    }
    return {
      ok: false,
      error: isErrorResponse(parsed) ? parsed.error : errorFromStatus(response.status),
    };
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }
    return { ok: false, error: "network" };
  } finally {
    clearTimeout(slowTimer);
  }
}
