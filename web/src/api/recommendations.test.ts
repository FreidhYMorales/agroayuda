import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RecommendationRequest } from "../contracts/contracts";
import { FIXTURE_OPTIONS } from "../features/comparison/fixture";
import { isAbortError, SLOW_MS } from "./client";
import { postRecommendations } from "./recommendations";

const fetchMock = vi.fn<typeof fetch>();

const REQUEST: RecommendationRequest = {
  location: { lat: 14.7, lon: -89.5 },
  current_rotation: { primera: "maiz", postrera: "frijol" },
  priorities: { water: 5, soil: 3, income: 3, risk: 3 },
  constraints: { irrigation: false },
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function opts() {
  return { signal: new AbortController().signal, onSlow: vi.fn() };
}

test("posts the request and returns the options", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ options: FIXTURE_OPTIONS }));

  const result = await postRecommendations(REQUEST, opts());

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.data.options).toHaveLength(3);
  }
  const [url, init] = fetchMock.mock.calls[0];
  expect(String(url)).toMatch(/\/recommendations$/);
  expect(init?.method).toBe("POST");
  expect(JSON.parse(String(init?.body))).toEqual(REQUEST);
});

test("maps 422 to invalid_request", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse({ error: "invalid_request", detail: "maicillo is not a primera crop" }, 422),
  );

  expect(await postRecommendations(REQUEST, opts())).toEqual({
    ok: false,
    error: "invalid_request",
  });
});

test("maps 404 outside_region", async () => {
  fetchMock.mockResolvedValue(
    jsonResponse({ error: "outside_region", detail: "Point outside the Dry Corridor region" }, 404),
  );

  expect(await postRecommendations(REQUEST, opts())).toEqual({
    ok: false,
    error: "outside_region",
  });
});

test("maps 500 to internal", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ error: "internal", detail: "boom" }, 500));

  expect(await postRecommendations(REQUEST, opts())).toEqual({ ok: false, error: "internal" });
});

test("maps a network failure to network", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

  expect(await postRecommendations(REQUEST, opts())).toEqual({ ok: false, error: "network" });
});

test("calls onSlow after 5 seconds without an answer", async () => {
  vi.useFakeTimers();
  fetchMock.mockReturnValue(new Promise<Response>(vi.fn()));
  const options = opts();

  void postRecommendations(REQUEST, options);
  await vi.advanceTimersByTimeAsync(SLOW_MS - 1);
  expect(options.onSlow).not.toHaveBeenCalled();
  await vi.advanceTimersByTimeAsync(1);

  expect(options.onSlow).toHaveBeenCalledTimes(1);
});

test("rethrows aborts so the caller can ignore them", async () => {
  fetchMock.mockRejectedValue(new DOMException("Aborted", "AbortError"));

  const error = await postRecommendations(REQUEST, opts()).catch((e: unknown) => e);

  expect(isAbortError(error)).toBe(true);
});
