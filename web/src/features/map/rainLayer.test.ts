// web/src/features/map/rainLayer.test.ts
import { describe, expect, test } from "vitest";
import type { Polygon, RainCellProperties } from "../../contracts/contracts";
import {
  NEUTRAL_RAIN_COLOR,
  RAIN_COLORS,
  type RainCollection,
  rainColor,
  rainDomain,
  rainFillExpression,
  rainLegendGradient,
  rainSourceDetail,
} from "./rainLayer";

const square: Polygon = {
  type: "Polygon",
  coordinates: [
    [
      [-89.6875, 14.25],
      [-89.0625, 14.25],
      [-89.0625, 14.75],
      [-89.6875, 14.75],
      [-89.6875, 14.25],
    ],
  ],
};

const properties = (valueMm: number, resolutionKm = 60): RainCellProperties => ({
  value_mm: valueMm,
  unit: "mm/año",
  source: "NASA POWER",
  resolution_km: resolutionKm,
});

const collection = (values: number[]): RainCollection => ({
  type: "FeatureCollection",
  features: values.map((value) => ({
    type: "Feature",
    geometry: square,
    properties: properties(value),
  })),
});

// Width of one bucket is (2000 - 1000) / 5 = 200 mm.
const domain = { min: 1000, max: 2000 };

describe("rainDomain", () => {
  test("is the lowest and highest annual rain among the cells", () => {
    expect(rainDomain(collection([900, 1500, 1200]))).toEqual({ min: 900, max: 1500 });
  });

  test("ignores cells whose value is not a finite number", () => {
    const cells = collection([Number.NaN, 1000, Number.POSITIVE_INFINITY, 2000]);

    expect(rainDomain(cells)).toEqual({ min: 1000, max: 2000 });
  });

  test("is null when no cell has a usable value", () => {
    expect(rainDomain(collection([]))).toBeNull();
    expect(rainDomain(collection([Number.NaN]))).toBeNull();
  });
});

describe("rainColor", () => {
  test("the palette has five valid hex colors", () => {
    expect(RAIN_COLORS).toHaveLength(5);
    for (const color of RAIN_COLORS) {
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  test("the lowest value gets the first color", () => {
    expect(rainColor(1000, domain)).toBe(RAIN_COLORS[0]);
  });

  test("the highest value gets the last color", () => {
    expect(rainColor(2000, domain)).toBe(RAIN_COLORS[4]);
  });

  test("splits the domain into five equal buckets", () => {
    expect(rainColor(1100, domain)).toBe(RAIN_COLORS[0]);
    expect(rainColor(1300, domain)).toBe(RAIN_COLORS[1]);
    expect(rainColor(1500, domain)).toBe(RAIN_COLORS[2]);
    expect(rainColor(1700, domain)).toBe(RAIN_COLORS[3]);
    expect(rainColor(1900, domain)).toBe(RAIN_COLORS[4]);
  });

  test("clamps values outside the domain", () => {
    expect(rainColor(500, domain)).toBe(RAIN_COLORS[0]);
    expect(rainColor(3000, domain)).toBe(RAIN_COLORS[4]);
  });

  test("a value that is not a finite number gets the neutral color", () => {
    expect(rainColor(Number.NaN, domain)).toBe(NEUTRAL_RAIN_COLOR);
  });

  test("a flat domain (every cell equal) gets the middle color", () => {
    expect(rainColor(1200, { min: 1200, max: 1200 })).toBe(RAIN_COLORS[2]);
  });
});

describe("rainFillExpression", () => {
  test("is a MapLibre step expression with ascending thresholds", () => {
    expect(rainFillExpression(domain)).toEqual([
      "step",
      ["get", "value_mm"],
      RAIN_COLORS[0],
      1200,
      RAIN_COLORS[1],
      1400,
      RAIN_COLORS[2],
      1600,
      RAIN_COLORS[3],
      1800,
      RAIN_COLORS[4],
    ]);
  });

  test("a flat domain is a plain color, because step thresholds must increase", () => {
    expect(rainFillExpression({ min: 1200, max: 1200 })).toBe(RAIN_COLORS[2]);
  });
});

describe("rainLegendGradient", () => {
  test("is a left-to-right gradient through the palette in order", () => {
    expect(rainLegendGradient()).toBe(`linear-gradient(to right, ${RAIN_COLORS.join(", ")})`);
  });
});

describe("rainSourceDetail", () => {
  test("shows the source and the cell size", () => {
    expect(rainSourceDetail(properties(1200))).toBe("NASA POWER · celdas de unos 60 km");
  });

  test("takes the cell size from the layer, not from a constant", () => {
    expect(rainSourceDetail(properties(1200, 30))).toBe("NASA POWER · celdas de unos 30 km");
  });

  test("rounds the cell size to the nearest 10 km, because the text says 'unos'", () => {
    expect(rainSourceDetail(properties(1396.1, 61.7))).toBe("NASA POWER · celdas de unos 60 km");
    expect(rainSourceDetail(properties(1396.1, 68))).toBe("NASA POWER · celdas de unos 70 km");
  });
});
