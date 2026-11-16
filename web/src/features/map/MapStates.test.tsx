// web/src/features/map/MapStates.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { MapStates } from "./MapStates";
import { chiquimulaPlace, chiquimulaSite, demoPlaces } from "./siteFixture";
import type { SiteState } from "./useSite";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

afterEach(cleanup);

const EMPTY_TEXT = "Toque el mapa o elija un lugar de la lista";
const SLOW_TEXT = "Despertando el servidor, un momento…";
const OUTSIDE_TEXT = "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea.";
const GEOLOCATION_TEXT = "No pudimos ver su ubicación. Toque el mapa o elija un lugar.";
const MAP_ERROR_TEXT = "No pudimos cargar el mapa; elija un lugar de la lista";

type Flags = { geolocationDenied?: boolean; mapError?: boolean };

function renderStates(site: SiteState, flags: Flags = {}) {
  const handlers = { onRetry: vi.fn(), onPickPlace: vi.fn() };
  const { container } = render(
    <MapStates
      site={site}
      geolocationDenied={flags.geolocationDenied ?? false}
      mapError={flags.mapError ?? false}
      places={demoPlaces}
      {...handlers}
    />,
  );
  return { ...handlers, container };
}

describe("MapStates empty", () => {
  test("asks to tap the map or pick a place, and shows the list", () => {
    renderStates({ status: "empty" });

    expect(screen.getByText(EMPTY_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
  });
});

describe("MapStates loading", () => {
  test("shows a grey card and no slow message", () => {
    renderStates({ status: "loading", slow: false });

    expect(screen.getByTestId("map-loading-card")).toBeTruthy();
    expect(screen.queryByText(SLOW_TEXT)).toBeNull();
  });

  test("when slow, says the server is waking up and keeps the grey card", () => {
    renderStates({ status: "loading", slow: true });

    expect(screen.getByText(SLOW_TEXT)).toBeTruthy();
    expect(screen.getByTestId("map-loading-card")).toBeTruthy();
  });
});

describe("MapStates errors", () => {
  test("outside_region explains the coverage and offers no retry", () => {
    renderStates({ status: "error", error: "outside_region" });

    expect(screen.getByText(OUTSIDE_TEXT)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).toBeNull();
  });

  test.each(["network", "internal", "not_found", "invalid_request"] as const)(
    "%s error shows Intentar de nuevo and the click retries",
    (error) => {
      const { onRetry } = renderStates({ status: "error", error });

      expect(screen.queryByText(OUTSIDE_TEXT)).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

      expect(onRetry).toHaveBeenCalledTimes(1);
    },
  );
});

describe("MapStates geolocation denied", () => {
  test("says the location could not be read and shows the list", () => {
    renderStates({ status: "empty" }, { geolocationDenied: true });

    expect(screen.getByText(GEOLOCATION_TEXT)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
  });

  test("replaces the empty message instead of repeating it", () => {
    renderStates({ status: "empty" }, { geolocationDenied: true });

    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
  });
});

describe("MapStates map error", () => {
  test("says the map could not load and the list is visible", () => {
    renderStates({ status: "empty" }, { mapError: true });

    expect(screen.getByText(MAP_ERROR_TEXT)).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(demoPlaces.length);
  });

  test("replaces the empty message instead of repeating it", () => {
    renderStates({ status: "empty" }, { mapError: true });

    expect(screen.queryByText(EMPTY_TEXT)).toBeNull();
  });

  test("picking a place from the list calls onPickPlace with it", () => {
    const { onPickPlace } = renderStates({ status: "empty" }, { mapError: true });

    fireEvent.click(screen.getByRole("button", { name: "Chiquimula" }));

    expect(onPickPlace).toHaveBeenCalledTimes(1);
    expect(onPickPlace).toHaveBeenCalledWith(chiquimulaPlace);
  });

  test("still shows the loading card when a place is being loaded", () => {
    renderStates({ status: "loading", slow: false }, { mapError: true });

    expect(screen.getByText(MAP_ERROR_TEXT)).toBeTruthy();
    expect(screen.getByTestId("map-loading-card")).toBeTruthy();
  });
});

describe("MapStates ready", () => {
  test("renders nothing, because the summary card belongs to the parent", () => {
    const { container } = renderStates({ status: "ready", site: chiquimulaSite });

    expect(container.textContent).toBe("");
  });
});
