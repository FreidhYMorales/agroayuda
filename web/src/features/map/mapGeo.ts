// web/src/features/map/mapGeo.ts
import type { StyleSpecification } from "maplibre-gl";
import type { Polygon, SiteProfile } from "../../contracts/contracts";

// Keyless vector tiles. Confirm the exact style URL in the OpenFreeMap docs.
export const OPENFREEMAP_STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

export interface CellCollection {
  type: "FeatureCollection";
  features: {
    type: "Feature";
    geometry: Polygon;
    properties: Record<string, never>;
  }[];
}

// The highlighted cell is the native cell polygon of the site, not a radius.
// With no site the collection is empty, which clears the highlight.
export function selectedCellData(site: SiteProfile | null): CellCollection {
  if (site === null) {
    return { type: "FeatureCollection", features: [] };
  }
  return {
    type: "FeatureCollection",
    features: [{ type: "Feature", geometry: site.cell_polygon, properties: {} }],
  };
}

// Plain background used when the basemap fails: it needs no network, so the
// region, the cells and the selection can still be drawn on top of it.
export function fallbackStyle(): StyleSpecification {
  return {
    version: 8,
    sources: {},
    layers: [{ id: "background", type: "background", paint: { "background-color": "#eef2f3" } }],
  };
}

export type LngLatBounds = [[number, number], [number, number]];

// West-south and east-north corners of the region outline, so the map can
// open framed on the area we cover. Null when there is nothing to frame.
export function regionBounds(region: { features: { geometry: Polygon }[] }): LngLatBounds | null {
  let west = Number.POSITIVE_INFINITY;
  let south = Number.POSITIVE_INFINITY;
  let east = Number.NEGATIVE_INFINITY;
  let north = Number.NEGATIVE_INFINITY;

  for (const feature of region.features) {
    for (const ring of feature.geometry.coordinates) {
      for (const [lon, lat] of ring) {
        west = Math.min(west, lon);
        south = Math.min(south, lat);
        east = Math.max(east, lon);
        north = Math.max(north, lat);
      }
    }
  }

  if (!Number.isFinite(west)) return null;
  return [
    [west, south],
    [east, north],
  ];
}
