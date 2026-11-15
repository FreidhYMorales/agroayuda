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
