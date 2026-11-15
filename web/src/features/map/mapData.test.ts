// web/src/features/map/mapData.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadMapData } from "./mapData";

const rainBody = {
  type: "FeatureCollection",
  data_version: "2026-11-14",
  features: [
    {
      type: "Feature",
      id: "13.5_-90.0",
      properties: {
        value_mm: 1396.1,
        unit: "mm/año",
        source: "NASA POWER (PRECTOTCORR diario, 1991-2020)",
        resolution_km: 61.7,
      },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-90.3125, 13.25],
            [-89.6875, 13.25],
            [-89.6875, 13.75],
            [-90.3125, 13.75],
            [-90.3125, 13.25],
          ],
        ],
      },
    },
  ],
};

const regionBody = {
  type: "FeatureCollection",
  data_version: "2026-11-14",
  features: [
    {
      type: "Feature",
      properties: { shapeName: "El Progreso", shapeISO: "GT-PR" },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-89.9, 15.1],
            [-89.8, 15.1],
            [-89.8, 15.2],
            [-89.9, 15.1],
          ],
        ],
      },
    },
  ],
};

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const maskBody = {
  type: "FeatureCollection",
  data_version: "2026-11-14",
  features: [
    {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [-180, -90],
            [180, -90],
            [180, 90],
            [-180, 90],
            [-180, -90],
          ],
          [
            [-89.9, 15.1],
            [-89.8, 15.2],
            [-89.8, 15.1],
            [-89.9, 15.1],
          ],
        ],
      },
    },
  ],
};

const isRain = (url: unknown) => String(url).endsWith("/data/layers/rain.geojson");
const isMask = (url: unknown) => String(url).endsWith("/data/region_mask.geojson");
const notFound = () => new Response("", { status: 404 });

// Answers each static file with the response its factory builds. A factory
// that throws becomes a rejected fetch. The mask is optional: 404 by default.
function serve(rain: () => Response, region: () => Response, mask: () => Response = notFound) {
  fetchMock.mockImplementation(async (url: unknown) => {
    if (isRain(url)) return rain();
    if (isMask(url)) return mask();
    return region();
  });
}

const options = () => ({ signal: new AbortController().signal });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadMapData", () => {
  test("requests the rain layer and the region outline from the site's /data folder", async () => {
    serve(
      () => json(rainBody),
      () => json(regionBody),
    );

    await loadMapData(options());

    const urls = fetchMock.mock.calls.map(([url]) => String(url));
    expect(urls).toHaveLength(3);
    expect(urls).toContain("/data/layers/rain.geojson");
    expect(urls).toContain("/data/region.geojson");
    expect(urls).toContain("/data/region_mask.geojson");
  });

  test("passes the abort signal to both requests", async () => {
    serve(
      () => json(rainBody),
      () => json(regionBody),
    );
    const controller = new AbortController();

    await loadMapData({ signal: controller.signal });

    for (const [, init] of fetchMock.mock.calls) {
      expect((init as RequestInit).signal).toBe(controller.signal);
    }
  });

  test("returns both collections on success", async () => {
    serve(
      () => json(rainBody),
      () => json(regionBody),
    );

    const result = await loadMapData(options());

    expect(result).toEqual({
      ok: true,
      data: { rain: rainBody, region: regionBody, mask: null },
    });
  });

  test("returns the region mask when the file exists", async () => {
    serve(
      () => json(rainBody),
      () => json(regionBody),
      () => json(maskBody),
    );

    const result = await loadMapData(options());

    expect(result).toEqual({
      ok: true,
      data: { rain: rainBody, region: regionBody, mask: maskBody },
    });
  });

  // The mask only dims the area outside the region: without it the map still works.
  test.each([
    ["is missing", notFound],
    ["is not valid JSON", () => new Response("{", { status: 200 })],
    ["is not a FeatureCollection", () => json({ type: "Feature" })],
    [
      "cannot be fetched",
      () => {
        throw new TypeError("network");
      },
    ],
  ])("still loads the map without a mask when the mask file %s", async (_case, mask) => {
    serve(
      () => json(rainBody),
      () => json(regionBody),
      mask,
    );

    const result = await loadMapData(options());

    expect(result).toEqual({
      ok: true,
      data: { rain: rainBody, region: regionBody, mask: null },
    });
  });

  test("fails when the rain file cannot be fetched", async () => {
    serve(
      () => {
        throw new TypeError("Failed to fetch");
      },
      () => json(regionBody),
    );

    expect(await loadMapData(options())).toEqual({ ok: false });
  });

  test("fails when the region file is missing", async () => {
    serve(
      () => json(rainBody),
      () => json({ detail: "Not found" }, 404),
    );

    expect(await loadMapData(options())).toEqual({ ok: false });
  });

  test("fails when a file is not valid JSON", async () => {
    serve(
      () => new Response("<html>not json</html>", { status: 200 }),
      () => json(regionBody),
    );

    expect(await loadMapData(options())).toEqual({ ok: false });
  });

  test("fails when a file is not a FeatureCollection", async () => {
    serve(
      () => json(rainBody),
      () => json({}),
    );

    expect(await loadMapData(options())).toEqual({ ok: false });
  });

  test("rethrows an abort so the caller can ignore the stale load", async () => {
    serve(
      () => {
        throw new DOMException("The operation was aborted.", "AbortError");
      },
      () => json(regionBody),
    );

    await expect(loadMapData(options())).rejects.toMatchObject({ name: "AbortError" });
  });
});
