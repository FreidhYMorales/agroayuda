// web/src/features/map/mapGeo.test.ts
import { describe, expect, test } from "vitest";
import { OPENFREEMAP_STYLE_URL, fallbackStyle, selectedCellData } from "./mapGeo";
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
