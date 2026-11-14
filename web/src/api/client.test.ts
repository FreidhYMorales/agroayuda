import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { isAbortError, requestJson, SLOW_MS } from "./client";

const fetchMock = vi.fn<typeof fetch>();

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

test("returns data on 2xx", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ status: "ok" }));

  const result = await requestJson<{ status: string }>("/health", opts());

  expect(result).toEqual({ ok: true, data: { status: "ok" } });
});

test("posts JSON bodies", async () => {
  fetchMock.mockResolvedValue(jsonResponse({}));

  await requestJson("/recommendations", { ...opts(), method: "POST", body: { a: 1 } });

  const [, init] = fetchMock.mock.calls[0];
  expect(init?.method).toBe("POST");
  expect(init?.body).toBe('{"a":1}');
});

test("maps an ErrorResponse body to its error code", async () => {
  fetchMock.mockResolvedValue(jsonResponse({ error: "outside_region", detail: "x" }, 404));

  const result = await requestJson("/site?lat=0&lon=0", opts());

  expect(result).toEqual({ ok: false, error: "outside_region" });
});

test("maps a 5xx without a contract body to internal", async () => {
  fetchMock.mockResolvedValue(new Response("Bad gateway", { status: 502 }));

  const result = await requestJson("/site", opts());

  expect(result).toEqual({ ok: false, error: "internal" });
});

test("maps a failed fetch to network", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

  const result = await requestJson("/site", opts());

  expect(result).toEqual({ ok: false, error: "network" });
});

test("calls onSlow once the request takes longer than SLOW_MS", async () => {
  vi.useFakeTimers();
  let resolve: (r: Response) => void = () => {};
  fetchMock.mockReturnValue(new Promise((r) => (resolve = r)));
  const o = opts();

  const pending = requestJson("/site", o);
  await vi.advanceTimersByTimeAsync(SLOW_MS);
  resolve(jsonResponse({}));
  await pending;

  expect(o.onSlow).toHaveBeenCalledTimes(1);
});

test("does not call onSlow for a fast answer", async () => {
  vi.useFakeTimers();
  fetchMock.mockResolvedValue(jsonResponse({}));
  const o = opts();

  await requestJson("/site", o);
  await vi.advanceTimersByTimeAsync(SLOW_MS * 2);

  expect(o.onSlow).not.toHaveBeenCalled();
});

test("rethrows aborts so the caller can ignore stale requests", async () => {
  fetchMock.mockRejectedValue(new DOMException("aborted", "AbortError"));

  const error = await requestJson("/site", opts()).catch((e: unknown) => e);

  expect(isAbortError(error)).toBe(true);
});
