// web/src/features/map/MapScreen.test.tsx
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { loadMapData, type MapDataResult, type RegionCollection } from "./mapData";
import type { MapViewProps } from "./MapView";
import { MapScreen, type MapScreenProps } from "./MapScreen";
import type { RainCollection } from "./rainLayer";
import { chiquimulaPlace, chiquimulaSite, demoPlaces, outsidePlace } from "./siteFixture";
import type { SiteState } from "./useSite";
import { COLORS } from "../../ui/colors";
import { MAP_SHEET } from "../../ui/layout";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

// jsdom reports colors as rgb(); compare through a probe so hex and rgb match.
function expectSameColor(actual: string, expected: string) {
  const probe = document.createElement("div");
  probe.style.backgroundColor = expected;
  expect(actual).toBe(probe.style.backgroundColor);
}

// MapLibre cannot draw in jsdom, so the map is replaced by a stub that shows
// whether it received a site and has buttons to fire its callbacks.
vi.mock("./MapView", () => ({
  MapView: (props: MapViewProps) => (
    <div data-testid="map-view" data-selected={props.site === null ? "none" : "site"}>
      <button type="button" onClick={() => props.onSelectPoint({ lat: 14.7, lon: -89.5 })}>
        tap-map
      </button>
      <button type="button" onClick={props.onError}>
        fail-map
      </button>
    </div>
  ),
}));

vi.mock("./mapData", () => ({ loadMapData: vi.fn() }));

const loadMapDataMock = vi.mocked(loadMapData);

const EMPTY_TEXT = "Toque el mapa o elija un lugar de la lista";
const SLOW_TEXT = "Despertando el servidor, un momento…";
const OUTSIDE_TEXT = "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea.";
const GEOLOCATION_TEXT = "No pudimos ver su ubicación. Toque el mapa o elija un lugar.";
const MAP_ERROR_TEXT = "No pudimos cargar el mapa; elija un lugar de la lista";
const LOCATE_LABEL = "📍 Usar mi ubicación";
const SOURCE_LINE = "Dato: NASA POWER ›";

const rain: RainCollection = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
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
      properties: {
        value_mm: 1396.1,
        unit: "mm/año",
        source: "NASA POWER (PRECTOTCORR diario, 1991-2020)",
        resolution_km: 61.7,
      },
    },
  ],
};

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

const loaded: MapDataResult = { ok: true, data: { rain, region, mask: null } };
const READY: SiteState = { status: "ready", site: chiquimulaSite };

// Browser callbacks of the latest getCurrentPosition call, so each test
// decides when and how the browser answers.
type OnSuccess = (position: GeolocationPosition) => void;
type OnFailure = (error: GeolocationPositionError) => void;
let succeed: OnSuccess = () => {};
let fail: OnFailure = () => {};

const getCurrentPosition = vi.fn((onSuccess: OnSuccess, onFailure: OnFailure) => {
  succeed = onSuccess;
  fail = onFailure;
});

const position = { coords: { latitude: 14.7, longitude: -89.5 } } as GeolocationPosition;
const deniedError = { code: 1, message: "User denied Geolocation" } as GeolocationPositionError;

beforeEach(() => {
  loadMapDataMock.mockReset();
  loadMapDataMock.mockResolvedValue(loaded);
  getCurrentPosition.mockClear();
  succeed = () => {};
  fail = () => {};
  // jsdom has no geolocation, so it is defined on the instance for each test.
  Object.defineProperty(navigator, "geolocation", {
    value: { getCurrentPosition },
    configurable: true,
  });
});

afterEach(() => {
  cleanup();
  Reflect.deleteProperty(navigator, "geolocation");
});

// Renders the screen without waiting for the map data.
function mountScreen(overrides: Partial<MapScreenProps> = {}) {
  const handlers = {
    onSelectPoint: vi.fn(),
    onRetry: vi.fn(),
    onViewRisks: vi.fn(),
    onViewRecommendations: vi.fn(),
  };
  const props: MapScreenProps = {
    site: { status: "empty" },
    placeId: undefined,
    places: demoPlaces,
    ...handlers,
    ...overrides,
  };
  const view = render(<MapScreen {...props} />);
  return { ...handlers, ...view };
}

// Renders the screen and waits until the map data has loaded and the map is mounted.
async function renderScreen(overrides: Partial<MapScreenProps> = {}) {
  const result = mountScreen(overrides);
  await screen.findByTestId("map-view");
  return result;
}

// A point picked on the map or by geolocation clears the place, so the card
// goes back to "Su zona". The key must exist (set to undefined) so the URL
// state merge removes the old place.
function expectPointWithoutPlace(selection: unknown, lat: number, lon: number) {
  expect(selection).toMatchObject({ lat, lon });
  expect(Object.keys(selection as object)).toContain("place");
  expect((selection as { place: unknown }).place).toBeUndefined();
}

describe("MapScreen places list", () => {
  test("with no point it asks to tap the map or pick a place, and shows the list", async () => {
    await renderScreen();

    expect(screen.getByText(EMPTY_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
  });

  test("picking a place selects its coordinates and its id", async () => {
    const { onSelectPoint } = await renderScreen();

    fireEvent.click(screen.getByRole("button", { name: "Chiquimula" }));

    expect(onSelectPoint).toHaveBeenCalledTimes(1);
    expect(onSelectPoint).toHaveBeenCalledWith({
      lat: chiquimulaPlace.location.lat,
      lon: chiquimulaPlace.location.lon,
      place: "chiquimula",
    });
  });

  test("the point outside the region is selected like any other, the API decides", async () => {
    const { onSelectPoint } = await renderScreen();

    fireEvent.click(screen.getByRole("button", { name: outsidePlace.name_es }));

    expect(onSelectPoint).toHaveBeenCalledWith({
      lat: outsidePlace.location.lat,
      lon: outsidePlace.location.lon,
      place: outsidePlace.id,
    });
  });
});

// Layout from docs/spec.md "1. Map": locate button on top, legend and source
// on the map, and the card in a bottom sheet visible without scrolling.
describe("MapScreen layout", () => {
  const precedes = (a: Element, b: Element) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  test("the locate button sits above the map", async () => {
    await renderScreen();

    expect(
      precedes(screen.getByRole("button", { name: LOCATE_LABEL }), screen.getByTestId("map-view")),
    ).toBe(true);
  });

  test("the legend and the source line sit on the map area", async () => {
    await renderScreen();

    const mapArea = screen.getByTestId("map-area");
    expect(mapArea.contains(screen.getByTestId("map-view"))).toBe(true);
    expect(mapArea.contains(screen.getByText("poca lluvia"))).toBe(true);
    expect(mapArea.contains(screen.getByRole("button", { name: SOURCE_LINE }))).toBe(true);
  });

  test("the summary card and the states sit in a sheet below the map", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    const sheet = screen.getByTestId("map-sheet");
    expect(precedes(screen.getByTestId("map-area"), sheet)).toBe(true);
    expect(sheet.contains(screen.getByText("Chiquimula"))).toBe(true);
    expect(sheet.contains(screen.getByRole("button", { name: "Ver riesgos" }))).toBe(true);
  });

  test("the sheet uses the warm background of the form and comparison", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    expectSameColor(screen.getByTestId("map-sheet").style.backgroundColor, COLORS.background);
  });

  test("the sheet scrolls on its own so the page does not", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    expect(screen.getByTestId("map-sheet").style.overflowY).toBe("auto");
  });
});

describe("MapScreen responsive layout (work package 09)", () => {
  const precedes = (a: Element, b: Element) =>
    (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;

  test("the screen, header, map area, sheet and handle carry the layout classes", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    const root = screen.getByRole("region");
    const sheet = screen.getByTestId("map-sheet");
    expect(root.classList).toContain("ag-map-screen");
    expect(root.querySelector(".ag-map-header")).not.toBeNull();
    expect(screen.getByTestId("map-area").classList).toContain("ag-map-area");
    expect(sheet.classList).toContain("ag-map-sheet");
    expect(sheet.querySelector(".ag-map-handle")).not.toBeNull();
  });

  test("no inline height, max height, corners or shadow are left to block the side layout", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    for (const element of [
      screen.getByRole("region"),
      screen.getByTestId("map-area"),
      screen.getByTestId("map-sheet"),
    ]) {
      expect(element.style.height).toBe("");
      expect(element.style.maxHeight).toBe("");
      expect(element.style.borderRadius).toBe("");
      expect(element.style.boxShadow).toBe("");
    }
  });

  test("the DOM order stays header, map, sheet (screen readers and tab order)", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    const header = screen.getByRole("region").querySelector(".ag-map-header");
    expect(header).not.toBeNull();
    expect(precedes(header as Element, screen.getByTestId("map-area"))).toBe(true);
    expect(precedes(screen.getByTestId("map-area"), screen.getByTestId("map-sheet"))).toBe(true);
  });
});

describe("MapScreen sheet expand (phone)", () => {
  test("the handle expands and collapses the sheet it controls", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });
    const sheet = screen.getByTestId("map-sheet");

    expect(sheet.getAttribute("data-expanded")).toBe("false");
    fireEvent.click(screen.getByRole("button", { name: "Mostrar más" }));
    expect(sheet.getAttribute("data-expanded")).toBe("true");
    expect(
      screen.getByRole("button", { name: "Mostrar menos" }).getAttribute("aria-controls"),
    ).toBe(sheet.id);

    fireEvent.click(screen.getByRole("button", { name: "Mostrar menos" }));
    expect(sheet.getAttribute("data-expanded")).toBe("false");
  });

  test("dragging the handle sizes the sheet freely, and a tap goes back to the fixed sizes", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });
    const sheet = screen.getByTestId("map-sheet");
    const header = document.querySelector(".ag-map-header") as HTMLElement;
    const section = document.querySelector(".ag-map-screen") as HTMLElement;
    // jsdom does no layout: give the screen, header and sheet a phone size.
    const box = (height: number) => ({ height }) as DOMRect;
    vi.spyOn(section, "getBoundingClientRect").mockReturnValue(box(640));
    vi.spyOn(header, "getBoundingClientRect").mockReturnValue(box(72));
    vi.spyOn(sheet, "getBoundingClientRect").mockReturnValue(box(300));
    const handle = screen.getByRole("button", { name: "Mostrar más" });

    fireEvent.pointerDown(handle, { clientY: 400 });
    fireEvent.pointerMove(handle, { clientY: 300 });
    fireEvent.pointerUp(handle, { clientY: 300 });

    expect(sheet.getAttribute("data-free")).toBe("true");
    expect(sheet.style.getPropertyValue("--ag-sheet-h")).toBe("400px");

    fireEvent.pointerDown(handle, { clientY: 300 });
    fireEvent.pointerMove(handle, { clientY: 0 });
    fireEvent.pointerUp(handle, { clientY: 0 });

    // Capped so a strip of map stays visible: 640 - 72 - MAP_SHEET.mapMinHeight.
    expect(sheet.style.getPropertyValue("--ag-sheet-h")).toBe(
      `${640 - 72 - MAP_SHEET.mapMinHeight}px`,
    );

    // A real tap: finger down and up in place, then the click.
    const tapped = screen.getByRole("button", { name: /Mostrar/ });
    fireEvent.pointerDown(tapped, { clientY: 100 });
    fireEvent.pointerUp(tapped, { clientY: 100 });
    fireEvent.click(tapped);
    expect(sheet.hasAttribute("data-free")).toBe(false);
    expect(sheet.style.getPropertyValue("--ag-sheet-h")).toBe("");
  });
});

describe("MapScreen summary card", () => {
  test("shows the picked place name, the zone line and the top risk", async () => {
    await renderScreen({ site: READY, placeId: "chiquimula" });

    expect(screen.getByText("Chiquimula")).toBeTruthy();
    expect(
      screen.getByText("Zona de unos 60 km de lado (dato regional, no de su parcela)"),
    ).toBeTruthy();
    expect(screen.getByText("⚠ Canícula fuerte")).toBeTruthy();
  });

  test("reads Su zona when the point did not come from the list", async () => {
    await renderScreen({ site: READY, placeId: undefined });

    expect(screen.getByText("Su zona")).toBeTruthy();
  });

  test("Ver riesgos calls onViewRisks", async () => {
    const { onViewRisks } = await renderScreen({ site: READY });

    fireEvent.click(screen.getByRole("button", { name: "Ver riesgos" }));

    expect(onViewRisks).toHaveBeenCalledTimes(1);
  });

  test("Ver recomendaciones calls onViewRecommendations", async () => {
    const { onViewRecommendations } = await renderScreen({ site: READY });

    fireEvent.click(screen.getByRole("button", { name: "Ver recomendaciones →" }));

    expect(onViewRecommendations).toHaveBeenCalledTimes(1);
  });

  test("O elija un lugar opens the list, which is hidden until then", async () => {
    await renderScreen({ site: READY });
    expect(screen.queryByRole("button", { name: "Chiquimula" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "O elija un lugar: ›" }));

    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
  });

  test("picking from the opened list selects the place and closes the list", async () => {
    const { onSelectPoint } = await renderScreen({ site: READY });
    fireEvent.click(screen.getByRole("button", { name: "O elija un lugar: ›" }));

    fireEvent.click(screen.getByRole("button", { name: "Chiquimula" }));

    expect(onSelectPoint).toHaveBeenCalledWith({
      lat: chiquimulaPlace.location.lat,
      lon: chiquimulaPlace.location.lon,
      place: "chiquimula",
    });
    expect(screen.queryByRole("button", { name: "Chiquimula" })).toBeNull();
  });

  test("when the map failed and the list is opened from the card, it is shown once", async () => {
    await renderScreen({ site: READY });
    fireEvent.click(screen.getByText("fail-map"));

    fireEvent.click(screen.getByRole("button", { name: "O elija un lugar: ›" }));

    expect(screen.getAllByRole("button", { name: "Chiquimula" })).toHaveLength(1);
  });
});

describe("MapScreen site states", () => {
  test("loading shows the grey card", async () => {
    await renderScreen({ site: { status: "loading", slow: false } });

    expect(screen.getByTestId("map-loading-card")).toBeTruthy();
    expect(screen.queryByText(SLOW_TEXT)).toBeNull();
  });

  test("a slow server says it is waking up", async () => {
    await renderScreen({ site: { status: "loading", slow: true } });

    expect(screen.getByText(SLOW_TEXT)).toBeTruthy();
  });

  test("outside_region explains the coverage", async () => {
    await renderScreen({ site: { status: "error", error: "outside_region" } });

    expect(screen.getByText(OUTSIDE_TEXT)).toBeTruthy();
  });

  test("a network error offers Intentar de nuevo and the click retries", async () => {
    const { onRetry } = await renderScreen({ site: { status: "error", error: "network" } });

    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("MapScreen map data", () => {
  test("the map is mounted only after its data has loaded", async () => {
    let finish: (result: MapDataResult) => void = () => {};
    loadMapDataMock.mockReturnValue(
      new Promise<MapDataResult>((resolve) => {
        finish = resolve;
      }),
    );

    mountScreen();
    expect(screen.queryByTestId("map-view")).toBeNull();

    await act(async () => {
      finish(loaded);
    });

    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  test("the map receives the site to highlight its cell", async () => {
    await renderScreen({ site: READY });

    expect(screen.getByTestId("map-view").getAttribute("data-selected")).toBe("site");
  });

  test("the map receives no site while it is loading", async () => {
    await renderScreen({ site: { status: "loading", slow: false } });

    expect(screen.getByTestId("map-view").getAttribute("data-selected")).toBe("none");
  });

  test("shows the rain legend and the NASA POWER source line once the data loaded", async () => {
    await renderScreen();

    expect(screen.getByText("poca lluvia")).toBeTruthy();
    expect(screen.getByText("mucha")).toBeTruthy();
    expect(screen.getByRole("button", { name: SOURCE_LINE })).toBeTruthy();
  });

  test("when the data fails, the map error shows with the list and the locate button", async () => {
    loadMapDataMock.mockResolvedValue({ ok: false });

    mountScreen();

    expect(await screen.findByText(MAP_ERROR_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
    expect(screen.getByRole("button", { name: LOCATE_LABEL })).toBeTruthy();
    expect(screen.queryByTestId("map-view")).toBeNull();
    expect(screen.queryByText("poca lluvia")).toBeNull();
    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
  });

  test("a map error shows the message and the list, and the map stays mounted", async () => {
    await renderScreen();

    fireEvent.click(screen.getByText("fail-map"));

    expect(screen.getByText(MAP_ERROR_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
    expect(screen.getByTestId("map-view")).toBeTruthy();
  });

  test("leaving the screen aborts the data request", async () => {
    const { unmount } = await renderScreen();
    const [options] = loadMapDataMock.mock.calls[0];

    unmount();

    expect(options.signal.aborted).toBe(true);
  });
});

describe("MapScreen geolocation and taps", () => {
  test("a found position is selected without a place", async () => {
    const { onSelectPoint } = await renderScreen();

    fireEvent.click(screen.getByRole("button", { name: LOCATE_LABEL }));
    expect(getCurrentPosition).toHaveBeenCalledTimes(1);
    act(() => {
      succeed(position);
    });

    expect(onSelectPoint).toHaveBeenCalledTimes(1);
    expectPointWithoutPlace(onSelectPoint.mock.calls[0][0], 14.7, -89.5);
  });

  test("a denied location says so and keeps the list visible", async () => {
    await renderScreen();

    fireEvent.click(screen.getByRole("button", { name: LOCATE_LABEL }));
    act(() => {
      fail(deniedError);
    });

    expect(screen.getByText(GEOLOCATION_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
  });

  test("tapping the map clears the denied location message", async () => {
    await renderScreen();
    fireEvent.click(screen.getByRole("button", { name: LOCATE_LABEL }));
    act(() => {
      fail(deniedError);
    });

    fireEvent.click(screen.getByText("tap-map"));

    expect(screen.queryByText(GEOLOCATION_TEXT)).toBeNull();
  });

  test("picking a place clears the denied location message", async () => {
    await renderScreen();
    fireEvent.click(screen.getByRole("button", { name: LOCATE_LABEL }));
    act(() => {
      fail(deniedError);
    });

    fireEvent.click(screen.getByRole("button", { name: "Chiquimula" }));

    expect(screen.queryByText(GEOLOCATION_TEXT)).toBeNull();
  });

  test("a tap on the map selects that point without a place", async () => {
    const { onSelectPoint } = await renderScreen();

    fireEvent.click(screen.getByText("tap-map"));

    expect(onSelectPoint).toHaveBeenCalledTimes(1);
    expectPointWithoutPlace(onSelectPoint.mock.calls[0][0], 14.7, -89.5);
  });
});

describe("MapScreen language", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("with lang=en in the URL the map texts are in English", async () => {
    window.history.replaceState(null, "", "/?step=map&lang=en");

    await renderScreen();

    expect(screen.getByRole("button", { name: "📍 Use my location" })).toBeTruthy();
    expect(screen.getByText("Tap the map or pick a place from the list")).toBeTruthy();
    expect(screen.getByText("little rain")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Data: NASA POWER ›" })).toBeTruthy();
    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
  });

  test("with lang=en the summary card and the source detail are in English", async () => {
    window.history.replaceState(null, "", "/?step=map&lang=en");

    await renderScreen({
      site: { ...READY, site: { ...chiquimulaSite, cell_resolution_km: 61.7 } },
    });
    fireEvent.click(screen.getByRole("button", { name: "Data: NASA POWER ›" }));

    expect(screen.getByRole("heading", { name: "Your area" })).toBeTruthy();
    expect(screen.getByText("Area about 60 km across (regional data, not your plot)")).toBeTruthy();
    expect(screen.getByRole("button", { name: "See risks" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "See recommendations →" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Or pick a place: ›" })).toBeTruthy();
    expect(
      screen.getByText("NASA POWER (PRECTOTCORR diario, 1991-2020) · cells of about 60 km"),
    ).toBeTruthy();
  });
});

describe("MapScreen language toggle", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("EN switches the map to English and takes lang out of the URL; ES puts lang=es back", async () => {
    await renderScreen();

    fireEvent.click(screen.getByRole("radio", { name: "English" }));

    expect(screen.getByRole("button", { name: "📍 Use my location" })).toBeTruthy();
    expect(new URLSearchParams(window.location.search).has("lang")).toBe(false);

    fireEvent.click(screen.getByRole("radio", { name: "Español" }));

    expect(screen.getByRole("button", { name: LOCATE_LABEL })).toBeTruthy();
    expect(new URLSearchParams(window.location.search).get("lang")).toBe("es");
  });
});

describe("MapScreen at 200% text zoom (work package 09)", () => {
  test("the header row may wrap, so ES/EN move below the locate button instead of off screen", async () => {
    await renderScreen();

    const locate = screen.getByRole("button", { name: LOCATE_LABEL });
    const row = screen.getByRole("region").querySelector(".ag-map-header > div") as HTMLElement;
    expect(row.contains(locate)).toBe(true);
    expect(row.style.flexWrap).toBe("wrap");
  });
});
