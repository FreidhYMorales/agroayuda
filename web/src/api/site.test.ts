// web/src/api/site.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { getSite } from "./site";

// Solo importa que `getSite` entregue lo que el API devolvió.
const siteBody = {
  location: { lat: 14.7, lon: -89.5 },
  cell_resolution_km: 60,
  risks: [],
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function abortError(): DOMException {
  return new DOMException("The operation was aborted.", "AbortError");
}

// fetch simulado que se rechaza con AbortError cuando su señal se aborta.
function pendingUntilAborted(init?: RequestInit): Promise<Response> {
  return new Promise((_resolve, reject) => {
    init?.signal?.addEventListener("abort", () => reject(abortError()));
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("getSite", () => {
  test("returns the site profile on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, siteBody));

    const result = await getSite(14.7, -89.5, {
      signal: new AbortController().signal,
      onSlow: vi.fn(),
    });

    expect(result).toEqual({ ok: true, site: siteBody });
  });

  test("requests /site with lat and lon", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, siteBody));

    await getSite(14.7, -89.5, {
      signal: new AbortController().signal,
      onSlow: vi.fn(),
    });

    const url = String(fetchMock.mock.calls[0][0]);
    expect(url).toContain("/site?lat=14.7&lon=-89.5");
  });

  test("maps a 404 outside_region to that error", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(404, {
        error: "outside_region",
        detail: "Point outside the Dry Corridor region",
      }),
    );

    const result = await getSite(0, 0, {
      signal: new AbortController().signal,
      onSlow: vi.fn(),
    });

    expect(result).toEqual({ ok: false, error: "outside_region" });
  });

  test("maps a rejected fetch to a network error", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await getSite(14.7, -89.5, {
      signal: new AbortController().signal,
      onSlow: vi.fn(),
    });

    expect(result).toEqual({ ok: false, error: "network" });
  });

  test("calls onSlow once after 5 s without an answer", async () => {
    vi.useFakeTimers();
    let answer: (response: Response) => void = () => {};
    fetchMock.mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          answer = resolve;
        }),
    );
    const onSlow = vi.fn();

    const pending = getSite(14.7, -89.5, {
      signal: new AbortController().signal,
      onSlow,
    });

    await vi.advanceTimersByTimeAsync(4999);
    expect(onSlow).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    expect(onSlow).toHaveBeenCalledTimes(1);

    answer(jsonResponse(200, siteBody));
    await expect(pending).resolves.toEqual({ ok: true, site: siteBody });
    expect(onSlow).toHaveBeenCalledTimes(1);
  });

  test("does not call onSlow when the answer is fast", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue(jsonResponse(200, siteBody));
    const onSlow = vi.fn();

    await getSite(14.7, -89.5, {
      signal: new AbortController().signal,
      onSlow,
    });
    await vi.advanceTimersByTimeAsync(10000);

    expect(onSlow).not.toHaveBeenCalled();
  });

  test("rethrows an abort so the caller can ignore the stale request", async () => {
    fetchMock.mockImplementation((_url, init) => pendingUntilAborted(init));
    const controller = new AbortController();

    const pending = getSite(14.7, -89.5, {
      signal: controller.signal,
      onSlow: vi.fn(),
    });
    controller.abort();

    await expect(pending).rejects.toMatchObject({ name: "AbortError" });
  });

  test("latest wins: the first call is aborted and the second resolves", async () => {
    fetchMock
      .mockImplementationOnce((_url, init) => pendingUntilAborted(init))
      .mockResolvedValueOnce(jsonResponse(200, siteBody));
    const first = new AbortController();
    const second = new AbortController();

    const firstCall = getSite(14.7, -89.5, { signal: first.signal, onSlow: vi.fn() });
    first.abort(); // una solicitud nueva reemplaza a la anterior
    const secondCall = getSite(14.6, -89.4, { signal: second.signal, onSlow: vi.fn() });

    await expect(firstCall).rejects.toMatchObject({ name: "AbortError" });
    await expect(secondCall).resolves.toEqual({ ok: true, site: siteBody });
  });
});
