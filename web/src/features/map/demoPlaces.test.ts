// web/src/features/map/demoPlaces.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadDemoPlaces } from "./demoPlaces";

// Same content as web/public/data/demo_points.json.
const fileBody = [
  { id: "chiquimula", name_es: "Chiquimula", location: { lat: 14.7, lon: -89.5 } },
  {
    id: "fuera_ciudad_guatemala",
    name_es: "Ciudad de Guatemala (fuera de la región)",
    location: { lat: 14.63, lon: -90.51 },
  },
];

const fetchMock = vi.fn();

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const options = () => ({ signal: new AbortController().signal });

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("loadDemoPlaces", () => {
  test("requests the demo points file from the site's /data folder with the abort signal", async () => {
    fetchMock.mockResolvedValue(json(fileBody));
    const controller = new AbortController();

    await loadDemoPlaces({ signal: controller.signal });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe("/data/demo_points.json");
    expect((init as RequestInit).signal).toBe(controller.signal);
  });

  test("returns the places in the order of the file", async () => {
    fetchMock.mockResolvedValue(json(fileBody));

    const result = await loadDemoPlaces(options());

    expect(result).toEqual({ ok: true, places: fileBody });
  });

  test("fails when the file cannot be fetched", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));

    expect(await loadDemoPlaces(options())).toEqual({ ok: false });
  });

  test("fails when the file is missing", async () => {
    fetchMock.mockResolvedValue(json({ detail: "Not found" }, 404));

    expect(await loadDemoPlaces(options())).toEqual({ ok: false });
  });

  test("fails when the file is not valid JSON", async () => {
    fetchMock.mockResolvedValue(new Response("<html>not json</html>", { status: 200 }));

    expect(await loadDemoPlaces(options())).toEqual({ ok: false });
  });

  test.each([
    ["is not a list", { places: [] }],
    ["has an item without a name", [{ id: "chiquimula", location: { lat: 14.7, lon: -89.5 } }]],
    [
      "has an item with a non-numeric coordinate",
      [{ id: "chiquimula", name_es: "Chiquimula", location: { lat: "14.7", lon: -89.5 } }],
    ],
  ])("fails when the file %s", async (_name, body) => {
    fetchMock.mockResolvedValue(json(body));

    expect(await loadDemoPlaces(options())).toEqual({ ok: false });
  });

  test("rethrows an abort so the caller can ignore the stale load", async () => {
    fetchMock.mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));

    await expect(loadDemoPlaces(options())).rejects.toMatchObject({ name: "AbortError" });
  });
});
