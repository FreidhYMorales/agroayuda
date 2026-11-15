// web/src/features/map/MapView.tsx
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AttributionControl,
  type GeoJSONSource,
  Map as MapLibreMap,
  type MapMouseEvent,
  setWorkerUrl,
} from "maplibre-gl";
import workerUrl from "maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url";
import { type CSSProperties, useEffect, useRef } from "react";
import type { SiteProfile } from "../../contracts/contracts";
import type { RegionCollection } from "./mapData";
import { fallbackStyle, OPENFREEMAP_STYLE_URL, regionBounds, selectedCellData } from "./mapGeo";
import {
  NEUTRAL_RAIN_COLOR,
  type RainCollection,
  rainDomain,
  rainFillExpression,
} from "./rainLayer";

export interface MapPoint {
  lat: number;
  lon: number;
}

export interface MapViewProps {
  // Both collections are loaded before the map is mounted and read once.
  rain: RainCollection;
  region: RegionCollection;
  // The site whose native cell is highlighted, or null for no selection.
  site: SiteProfile | null;
  onSelectPoint: (point: MapPoint) => void;
  // Called once, when the basemap fails and the plain fallback style takes over.
  onError: () => void;
}

const RAIN_SOURCE = "rain";
const REGION_SOURCE = "region";
const SELECTED_SOURCE = "selected-cell";

// [lon, lat] over the Dry Corridor.
const INITIAL_CENTER: [number, number] = [-89.6, 14.9];
const INITIAL_ZOOM = 7;

// Verify the exact wording OpenFreeMap asks for in its documentation.
const ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> ' +
  '<a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">© OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

const containerStyle: CSSProperties = { width: "100%", height: "100%", minHeight: 240 };

interface OverlayData {
  rain: RainCollection;
  region: RegionCollection;
  site: SiteProfile | null;
}

// MapLibre drops every source and layer when the style changes, so this runs
// on each "style.load" (the first load and the switch to the fallback style).
function addOverlays(map: MapLibreMap, data: OverlayData): void {
  // Adding a source twice throws, so skip if the overlays are already there.
  if (map.getSource(RAIN_SOURCE) !== undefined) return;

  const domain = rainDomain(data.rain);
  const fillColor = domain === null ? NEUTRAL_RAIN_COLOR : rainFillExpression(domain);

  map.addSource(RAIN_SOURCE, { type: "geojson", data: data.rain });
  map.addSource(REGION_SOURCE, { type: "geojson", data: data.region });
  map.addSource(SELECTED_SOURCE, { type: "geojson", data: selectedCellData(data.site) });

  // Layers are drawn in the order they are added: cells, then the region
  // outline above them, then the selected cell above both.
  map.addLayer({
    id: "rain-fill",
    type: "fill",
    source: RAIN_SOURCE,
    // MapLibre types expressions as strict tuples; `rainFillExpression` builds
    // a valid "step" expression as a plain array, so it is cast at this boundary.
    paint: { "fill-color": fillColor as never, "fill-opacity": 0.65 },
  });
  map.addLayer({
    id: "region-outline",
    type: "line",
    source: REGION_SOURCE,
    // Thin on purpose: the file has one polygon per department, so internal
    // borders are drawn too until the data owner provides a merged outline.
    paint: { "line-color": "#1a1a1a", "line-width": 1.5 },
  });
  map.addLayer({
    id: "selected-cell-outline",
    type: "line",
    source: SELECTED_SOURCE,
    paint: { "line-color": "#e66101", "line-width": 3 },
  });
}

export function MapView({ rain, region, site, onSelectPoint, onError }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);

  // The map is created once, so its event handlers read the latest props
  // through this ref instead of capturing the first render's values.
  const latest = useRef({ rain, region, site, onSelectPoint, onError });
  useEffect(() => {
    latest.current = { rain, region, site, onSelectPoint, onError };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) return;
    // MapLibre derives its worker URL from the location of its own file. Once
    // Vite bundles MapLibre into another file (pre-bundled in dev, a hashed
    // chunk in the build) there is no worker next to it and the map fails with
    // "Worker failed to load". Passing the URL explicitly works in dev and in
    // production, and the worker is bundled with whatever it imports.
    setWorkerUrl(workerUrl);

    const map = new MapLibreMap({
      container,
      style: OPENFREEMAP_STYLE_URL,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      // Frame the region we cover; center and zoom are only the fallback.
      // Read through the ref: the map is created once, not per region change.
      bounds: regionBounds(latest.current.region) ?? undefined,
      fitBoundsOptions: { padding: 24 },
      // The default control is replaced by one with fixed text, so the
      // attribution stays visible with the fallback style too.
      attributionControl: false,
    });
    mapRef.current = map;
    map.addControl(new AttributionControl({ compact: true, customAttribution: ATTRIBUTION }));

    map.on("style.load", () => addOverlays(map, latest.current));

    map.on("click", (event: MapMouseEvent) => {
      latest.current.onSelectPoint({ lat: event.lngLat.lat, lon: event.lngLat.lng });
    });

    // Any map error counts as a basemap failure: report it once and switch to
    // the plain style, which needs no network and still draws our overlays.
    let failed = false;

    map.on("error", () => {
      if (failed) return;
      failed = true;
      latest.current.onError();
      // diff: false forces a full style reload. By default MapLibre diffs object
      // styles against the current one, which would remove our overlays (they
      // are not in the fallback style) without firing "style.load", so they
      // would never be added again.
      map.setStyle(fallbackStyle(), { diff: false });
    });

    return () => {
      mapRef.current = null;
      map.remove();
    };
  }, []);

  // Move the highlight when the site changes, without recreating the map.
  // Before the style loads there is no source yet; "style.load" draws it then.
  useEffect(() => {
    const source = mapRef.current?.getSource(SELECTED_SOURCE) as GeoJSONSource | undefined;
    source?.setData(selectedCellData(site));
  }, [site]);

  return <div ref={containerRef} style={containerStyle} />;
}
