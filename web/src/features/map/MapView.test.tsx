// web/src/features/map/MapView.test.tsx
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import type { SiteProfile } from "../../contracts/contracts";
import type { RegionCollection } from "./mapData";
import { fallbackStyle, OPENFREEMAP_STYLE_URL, selectedCellData } from "./mapGeo";
import { MapView } from "./MapView";
import { type RainCollection, rainFillExpression } from "./rainLayer";
import { chiquimulaSite } from "./siteFixture";

type Handler = (event?: unknown) => void;
type SourceSpec = { type: string; data: unknown };
type LayerSpec = {
  id: string;
  type: string;
  source: string;
  paint?: Record<string, unknown>;
};
type MapOptions = {
  container: unknown;
  style: unknown;
  center: [number, number];
  zoom: number;
  attributionControl: unknown;
};

// State of the fake maplibre-gl. It is hoisted so the vi.mock factory can use it.
const mocks = vi.hoisted(() => {
  const handlers = new Map<string, Handler[]>();
  const sources = new Map<string, { setData: ReturnType<typeof vi.fn> }>();

  const api = {
    mapCreated: vi.fn((_options: MapOptions) => undefined),
    attributionCreated: vi.fn((_options: { customAttribution?: string }) => undefined),
    on: vi.fn((event: string, handler: Handler) => {
      handlers.set(event, [...(handlers.get(event) ?? []), handler]);
    }),
    addControl: vi.fn((_control: unknown) => undefined),
    addSource: vi.fn((id: string, _spec: SourceSpec) => {
      sources.set(id, { setData: vi.fn() });
    }),
    addLayer: vi.fn((_layer: LayerSpec) => undefined),
    getSource: vi.fn((id: string) => sources.get(id)),
    // Like the real map, a new style drops every source and layer.
    setStyle: vi.fn((_style: unknown) => {
      sources.clear();
    }),
    remove: vi.fn(() => undefined),
  };

  return { handlers, sources, api };
});

vi.mock("maplibre-gl", () => {
  class FakeMap {
    on = mocks.api.on;
    addControl = mocks.api.addControl;
    addSource = mocks.api.addSource;
    addLayer = mocks.api.addLayer;
    getSource = mocks.api.getSource;
    setStyle = mocks.api.setStyle;
    remove = mocks.api.remove;

    constructor(options: MapOptions) {
      mocks.api.mapCreated(options);
    }
  }

  class FakeAttributionControl {
    constructor(options: { customAttribution?: string }) {
      mocks.api.attributionCreated(options);
    }
  }

  return {
    Map: FakeMap,
    AttributionControl: FakeAttributionControl,
    default: { Map: FakeMap, AttributionControl: FakeAttributionControl },
  };
});

const cell = (valueMm: number, west: number): RainCollection["features"][number] => ({
  type: "Feature",
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [west, 13.25],
        [west + 0.625, 13.25],
        [west + 0.625, 13.75],
        [west, 13.75],
        [west, 13.25],
      ],
    ],
  },
  properties: { value_mm: valueMm, unit: "mm/año", source: "NASA POWER", resolution_km: 61.7 },
});

const rain: RainCollection = {
  type: "FeatureCollection",
  features: [cell(1100, -90.3125), cell(1396.1, -89.6875)],
};
const rainDomain = { min: 1100, max: 1396.1 };

const region: RegionCollection = {
  type: "FeatureCollection",
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

beforeEach(() => {
  vi.clearAllMocks();
  mocks.handlers.clear();
  mocks.sources.clear();
});

afterEach(cleanup);

// Fires an event as the map would, inside act so React state settles.
function emit(event: string, payload?: unknown) {
  act(() => {
    for (const handler of mocks.handlers.get(event) ?? []) handler(payload);
  });
}

function renderMap(site: SiteProfile | null = null) {
  const onSelectPoint = vi.fn();
  const onError = vi.fn();
  const view = (current: SiteProfile | null) => (
    <MapView
      rain={rain}
      region={region}
      site={current}
      onSelectPoint={onSelectPoint}
      onError={onError}
    />
  );
  const result = render(view(site));
  return {
    ...result,
    onSelectPoint,
    onError,
    rerenderWith: (next: SiteProfile | null) => result.rerender(view(next)),
  };
}

const layerIds = () => mocks.api.addLayer.mock.calls.map(([layer]) => layer.id);
const sourceCalls = (id: string) =>
  mocks.api.addSource.mock.calls.filter(([sourceId]) => sourceId === id);

describe("MapView setup", () => {
  test("creates the map once with the OpenFreeMap style, centered on Guatemala", () => {
    const { rerenderWith } = renderMap();
    rerenderWith(chiquimulaSite);

    expect(mocks.api.mapCreated).toHaveBeenCalledTimes(1);
    const options = mocks.api.mapCreated.mock.calls[0][0];
    expect(options.container).toBeInstanceOf(HTMLElement);
    expect(options.style).toBe(OPENFREEMAP_STYLE_URL);
    expect(options.center[0]).toBeGreaterThan(-92.3);
    expect(options.center[0]).toBeLessThan(-88.2);
    expect(options.center[1]).toBeGreaterThan(13.7);
    expect(options.center[1]).toBeLessThan(17.8);
    expect(options.zoom).toBeGreaterThanOrEqual(5);
  });

  test("shows the OpenFreeMap and OpenStreetMap attribution", () => {
    renderMap();

    expect(mocks.api.mapCreated.mock.calls[0][0].attributionControl).toBe(false);
    expect(mocks.api.attributionCreated).toHaveBeenCalledTimes(1);
    const text = mocks.api.attributionCreated.mock.calls[0][0].customAttribution ?? "";
    expect(text).toContain("OpenFreeMap");
    expect(text).toContain("OpenStreetMap");
    expect(mocks.api.addControl).toHaveBeenCalledTimes(1);
  });

  test("removes the map when the component unmounts", () => {
    const { unmount } = renderMap();

    unmount();

    expect(mocks.api.remove).toHaveBeenCalledTimes(1);
  });
});

describe("MapView overlays", () => {
  test("adds no overlay before the style loads, then adds the three sources", () => {
    renderMap();
    expect(mocks.api.addSource).not.toHaveBeenCalled();

    emit("style.load");

    expect(mocks.api.addSource.mock.calls.map(([id]) => id)).toEqual([
      "rain",
      "region",
      "selected-cell",
    ]);
  });

  test("feeds the cells and the region outline as GeoJSON", () => {
    renderMap();

    emit("style.load");

    expect(sourceCalls("rain")[0][1]).toEqual({ type: "geojson", data: rain });
    expect(sourceCalls("region")[0][1]).toEqual({ type: "geojson", data: region });
  });

  test("draws the region outline above the cells and the selection above both", () => {
    renderMap();

    emit("style.load");

    expect(layerIds()).toEqual(["rain-fill", "region-outline", "selected-cell-outline"]);
  });

  test("colors the cells with the rain scale of the loaded data", () => {
    renderMap();

    emit("style.load");

    const [rainLayer] = mocks.api.addLayer.mock.calls[0];
    expect(rainLayer).toMatchObject({ id: "rain-fill", type: "fill", source: "rain" });
    expect(rainLayer.paint?.["fill-color"]).toEqual(rainFillExpression(rainDomain));
  });
});

describe("MapView selection", () => {
  test("highlights the native cell polygon of the site that is already selected", () => {
    renderMap(chiquimulaSite);

    emit("style.load");

    expect(sourceCalls("selected-cell")[0][1]).toEqual({
      type: "geojson",
      data: selectedCellData(chiquimulaSite),
    });
  });

  test("starts with an empty selection when there is no site", () => {
    renderMap(null);

    emit("style.load");

    expect(sourceCalls("selected-cell")[0][1]).toEqual({
      type: "geojson",
      data: selectedCellData(null),
    });
  });

  test("a site that arrives before the style loads is the one drawn", () => {
    const { rerenderWith } = renderMap(null);
    rerenderWith(chiquimulaSite);

    emit("style.load");

    expect(sourceCalls("selected-cell")[0][1]).toEqual({
      type: "geojson",
      data: selectedCellData(chiquimulaSite),
    });
  });

  test("a new site updates the highlight without recreating the map", () => {
    const { rerenderWith } = renderMap(null);
    emit("style.load");

    rerenderWith(chiquimulaSite);

    expect(mocks.sources.get("selected-cell")?.setData).toHaveBeenCalledWith(
      selectedCellData(chiquimulaSite),
    );
    expect(mocks.api.mapCreated).toHaveBeenCalledTimes(1);
  });

  test("clearing the site clears the highlight", () => {
    const { rerenderWith } = renderMap(chiquimulaSite);
    emit("style.load");

    rerenderWith(null);

    expect(mocks.sources.get("selected-cell")?.setData).toHaveBeenLastCalledWith(
      selectedCellData(null),
    );
  });

  test("a tap on the map selects that point as lat and lon", () => {
    const { onSelectPoint } = renderMap();

    emit("click", { lngLat: { lng: -89.5, lat: 14.7 } });

    expect(onSelectPoint).toHaveBeenCalledTimes(1);
    expect(onSelectPoint).toHaveBeenCalledWith({ lat: 14.7, lon: -89.5 });
  });
});

describe("MapView errors", () => {
  test("a map error is reported and the plain fallback style takes over", () => {
    const { onError } = renderMap();

    emit("error", { error: new Error("tile failed") });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(mocks.api.setStyle).toHaveBeenCalledTimes(1);
    expect(mocks.api.setStyle).toHaveBeenCalledWith(fallbackStyle());
  });

  test("further errors do not report again or swap the style again", () => {
    const { onError } = renderMap();

    emit("error", { error: new Error("tile failed") });
    emit("error", { error: new Error("another tile failed") });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(mocks.api.setStyle).toHaveBeenCalledTimes(1);
  });

  test("the overlays are added again after the style changes", () => {
    renderMap();
    emit("style.load");

    emit("error", { error: new Error("tile failed") });
    emit("style.load");

    expect(sourceCalls("rain")).toHaveLength(2);
    expect(sourceCalls("region")).toHaveLength(2);
    expect(sourceCalls("selected-cell")).toHaveLength(2);
  });
});
