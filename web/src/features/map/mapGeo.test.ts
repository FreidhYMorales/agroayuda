// web/src/features/map/mapGeo.test.ts
import { describe, expect, test } from "vitest";
import { OPENFREEMAP_STYLE_URL, fallbackStyle, regionBounds, selectedCellData } from "./mapGeo";
import { chiquimulaSite } from "./siteFixture";

describe("selectedCellData", () => {
  test("is one feature with the native cell polygon of the site, not a radius", () => {
    expect(selectedCellData(chiquimulaSite)).toEqual({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: chiquimulaSite.cell_polygon,
          properties: {},
        },
      ],
    });
  });

  test("is an empty collection when nothing is selected, so the highlight clears", () => {
    expect(selectedCellData(null)).toEqual({ type: "FeatureCollection", features: [] });
  });
});

describe("basemap styles", () => {
  test("the OpenFreeMap style is served over https from openfreemap", () => {
    expect(OPENFREEMAP_STYLE_URL.startsWith("https://tiles.openfreemap.org/")).toBe(true);
  });

  test("the fallback style is a plain background with no sources", () => {
    const style = fallbackStyle();

    expect(style.version).toBe(8);
    expect(style.sources).toEqual({});
    expect(style.layers).toEqual([
      expect.objectContaining({ id: "background", type: "background" }),
    ]);
  });

  test("the fallback style needs no network, and every call returns a fresh copy", () => {
    expect(JSON.stringify(fallbackStyle())).not.toContain("http");
    expect(fallbackStyle()).not.toBe(fallbackStyle());
  });
});

describe("regionBounds", () => {
  const square = (west: number, south: number, east: number, north: number) => ({
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [west, south],
          [east, south],
          [east, north],
          [west, north],
          [west, south],
        ],
      ],
    },
  });

  test("returns the west-south and east-north corners of every polygon", () => {
    const bounds = regionBounds({
      features: [square(-90.2, 14.4, -89.6, 15.0), square(-89.9, 14.0, -89.1, 14.9)],
    });

    expect(bounds).toEqual([
      [-90.2, 14.0],
      [-89.1, 15.0],
    ]);
  });

  test("returns null for a region with no features", () => {
    expect(regionBounds({ features: [] })).toBeNull();
  });
});
