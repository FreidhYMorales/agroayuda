// web/src/features/map/rainLayer.ts
import type { Polygon, RainCellProperties } from "../../contracts/contracts";
import { MAP_COPY } from "./copy";

export interface RainCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: Polygon;
    properties: RainCellProperties;
  }[];
}

export interface RainDomain {
  min: number;
  max: number;
}

// A MapLibre paint value: a plain color, or a "step" expression.
export type RainFill = string | (string | number | string[])[];

// Sequential single-hue palette, from "poca lluvia" to "mucha".
export const RAIN_COLORS = ["#eff3ff", "#bdd7e7", "#6baed6", "#3182bd", "#08519c"] as const;
export const NEUTRAL_RAIN_COLOR = "#cccccc";

const BUCKETS = RAIN_COLORS.length;
const MIDDLE_COLOR = RAIN_COLORS[2];

// Lowest and highest annual rain among the cells with a usable value.
export function rainDomain(collection: RainCollection): RainDomain | null {
  let min = Number.POSITIVE_INFINITY;
  let max = Number.NEGATIVE_INFINITY;

  for (const feature of collection.features) {
    const value = feature.properties.value_mm;
    if (!Number.isFinite(value)) continue;
    if (value < min) min = value;
    if (value > max) max = value;
  }

  return min <= max ? { min, max } : null;
}

// The domain is split into equal buckets, one per palette color.
export function rainColor(valueMm: number, domain: RainDomain): string {
  if (!Number.isFinite(valueMm)) return NEUTRAL_RAIN_COLOR;
  // Every cell has the same rain: there is no scale to draw.
  if (domain.max <= domain.min) return MIDDLE_COLOR;

  const width = (domain.max - domain.min) / BUCKETS;
  const bucket = Math.floor((valueMm - domain.min) / width);
  const index = Math.min(BUCKETS - 1, Math.max(0, bucket));
  return RAIN_COLORS[index] ?? NEUTRAL_RAIN_COLOR;
}

// Same buckets as `rainColor`, as a MapLibre expression for the fill layer.
export function rainFillExpression(domain: RainDomain): RainFill {
  // Step thresholds must strictly increase, so a flat domain is a plain color.
  if (domain.max <= domain.min) return MIDDLE_COLOR;

  const width = (domain.max - domain.min) / BUCKETS;
  const stops = RAIN_COLORS.slice(1).flatMap((color, i) => [domain.min + width * (i + 1), color]);
  return ["step", ["get", "value_mm"], RAIN_COLORS[0], ...stops];
}

export function rainLegendGradient(): string {
  return `linear-gradient(to right, ${RAIN_COLORS.join(", ")})`;
}

// Detail shown when the farmer opens the source line.
export function rainSourceDetail(properties: RainCellProperties): string {
  return `${properties.source} · ${MAP_COPY.rainCells(properties.resolution_km)}`;
}
