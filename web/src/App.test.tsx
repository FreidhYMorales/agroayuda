// web/src/App.test.tsx
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, type MockInstance, test, vi } from "vitest";
import { App } from "./App";
import { getSite, type SiteResult } from "./api/site";
import type { MapScreenProps } from "./features/map/MapScreen";
import { chiquimulaSite } from "./features/map/siteFixture";
import type { RisksScreenProps } from "./features/risks/RisksScreen";

// Lets a test make a screen throw while it renders, to exercise the boundary.
const crash = vi.hoisted(() => ({ map: false, risks: false }));

vi.mock("./api/site", () => ({ getSite: vi.fn() }));

// The screens have their own tests. Here they are replaced by stubs that show
// what App passed them and have buttons to fire their callbacks.
vi.mock("./features/map/MapScreen", () => ({
  MapScreen: (props: MapScreenProps) => {
    if (crash.map) throw new Error("map screen crashed");
    return (
      <div
        data-testid="map-screen"
        data-site={props.site.status}
        data-place={props.placeId ?? ""}
        data-places={props.places.map((place) => place.id).join(",")}
      >
        <button
          type="button"
          onClick={() => props.onSelectPoint({ lat: 14.7, lon: -89.5, place: "chiquimula" })}
        >
          pick-chiquimula
        </button>
        <button
          type="button"
          onClick={() => props.onSelectPoint({ lat: 14.6, lon: -89.4, place: undefined })}
        >
          tap-map
        </button>
        <button type="button" onClick={props.onRetry}>
          map-retry
        </button>
        <button type="button" onClick={props.onViewRisks}>
          view-risks
        </button>
        <button type="button" onClick={props.onViewRecommendations}>
          view-recommendations
        </button>
      </div>
    );
  },
}));

// The places list comes from a static file loaded by this hook, which has its own tests.
vi.mock("./features/map/useDemoPlaces", () => {
  const places = [{ id: "chiquimula", name_es: "Chiquimula", location: { lat: 14.7, lon: -89.5 } }];
  return { useDemoPlaces: () => places };
});

// Package 04 owns the form and results flow; here we only check that App shows
// it. Like the real flow, the stub changes the step through its own
// useAppState, as "← Su parcela" does in the form.
vi.mock("./features/comparison/ResultsFlow", async () => {
  const { useAppState } = await import("./lib/urlState");
  return {
    ResultsFlow: () => {
      const [, setState] = useAppState();
      return (
        <div data-testid="results-flow">
          <button type="button" onClick={() => setState({ step: "map" })}>
            flow-back-to-map
          </button>
        </div>
      );
    },
  };
});

vi.mock("./features/risks/RisksScreen", () => ({
  RisksScreen: (props: RisksScreenProps) => {
    if (crash.risks) throw new Error("risks screen crashed");
    return (
      <div
        data-testid="risks-screen"
        data-view={props.view.status}
        data-risk-ids={
          props.view.status === "ready" ? props.view.risks.map((risk) => risk.id).join(",") : ""
        }
      >
        <button type="button" onClick={props.onClose}>
          risks-close
        </button>
        <button type="button" onClick={props.onRetry}>
          risks-retry
        </button>
        <button type="button" onClick={props.onContinue}>
          risks-continue
        </button>
      </div>
    );
  },
}));

const getSiteMock = vi.mocked(getSite);
const ready: SiteResult = { ok: true, site: chiquimulaSite };
const networkError: SiteResult = { ok: false, error: "network" };

const POINT = "lat=14.7&lon=-89.5";

const goTo = (search: string) => window.history.replaceState(null, "", `/${search}`);
const params = () => new URLSearchParams(window.location.search);
const renderApp = () => render(<App />);
const mapSite = () => screen.getByTestId("map-screen").getAttribute("data-site");
const risksView = () => screen.getByTestId("risks-screen").getAttribute("data-view");

beforeEach(() => {
  getSiteMock.mockReset();
  getSiteMock.mockResolvedValue(ready);
  crash.map = false;
  crash.risks = false;
  goTo("");
});

afterEach(cleanup);

describe("App map step", () => {
  test("starts on the map with no point and does not ask for the site", () => {
    renderApp();

    expect(mapSite()).toBe("empty");
    expect(screen.queryByTestId("risks-screen")).toBeNull();
    expect(getSiteMock).not.toHaveBeenCalled();
  });

  test("a point in the URL asks for the site once and gives it to the map", async () => {
    goTo(`?${POINT}`);

    renderApp();

    await waitFor(() => expect(mapSite()).toBe("ready"));
    expect(getSiteMock).toHaveBeenCalledTimes(1);
    expect(getSiteMock.mock.calls[0].slice(0, 2)).toEqual([14.7, -89.5]);
  });

  test("picking a place writes the point and the place to the URL and asks for the site", async () => {
    renderApp();

    fireEvent.click(screen.getByText("pick-chiquimula"));

    expect(params().get("step")).toBe("map");
    expect(params().get("lat")).toBe("14.7");
    expect(params().get("lon")).toBe("-89.5");
    expect(params().get("place")).toBe("chiquimula");
    expect(screen.getByTestId("map-screen").getAttribute("data-place")).toBe("chiquimula");
    await waitFor(() => expect(mapSite()).toBe("ready"));
    expect(getSiteMock.mock.calls[0].slice(0, 2)).toEqual([14.7, -89.5]);
  });

  test("a tapped point replaces the place that was selected before", () => {
    goTo(`?${POINT}&place=chiquimula`);
    renderApp();

    fireEvent.click(screen.getByText("tap-map"));

    expect(params().get("lat")).toBe("14.6");
    expect(params().get("lon")).toBe("-89.4");
    expect(params().get("place")).toBeNull();
    expect(screen.getByTestId("map-screen").getAttribute("data-place")).toBe("");
  });

  test("the map gets the demo places the loader returned", () => {
    renderApp();

    expect(screen.getByTestId("map-screen").getAttribute("data-places")).toBe("chiquimula");
  });

  test("retrying from the map asks for the site again", async () => {
    getSiteMock.mockResolvedValue(networkError);
    goTo(`?${POINT}`);
    renderApp();
    await waitFor(() => expect(mapSite()).toBe("error"));

    fireEvent.click(screen.getByText("map-retry"));

    await waitFor(() => expect(getSiteMock).toHaveBeenCalledTimes(2));
  });
});

describe("App risks step", () => {
  test("Ver riesgos opens the risks screen and puts the step in the URL", () => {
    goTo(`?${POINT}`);
    renderApp();

    fireEvent.click(screen.getByText("view-risks"));

    expect(params().get("step")).toBe("risks");
    expect(params().get("lat")).toBe("14.7");
    expect(screen.getByTestId("risks-screen")).toBeTruthy();
    expect(screen.queryByTestId("map-screen")).toBeNull();
  });

  test("changing step does not ask for the site again", async () => {
    goTo(`?${POINT}`);
    renderApp();
    await waitFor(() => expect(mapSite()).toBe("ready"));

    fireEvent.click(screen.getByText("view-risks"));

    await waitFor(() => expect(risksView()).toBe("ready"));
    expect(getSiteMock).toHaveBeenCalledTimes(1);
  });

  test("the risks screen gets the risks of the site", async () => {
    goTo(`?step=risks&${POINT}`);

    renderApp();

    await waitFor(() => expect(risksView()).toBe("ready"));
    expect(screen.getByTestId("risks-screen").getAttribute("data-risk-ids")).toBe(
      "canicula,bare_field",
    );
  });

  test("the risks screen shows loading while the site is on its way", () => {
    getSiteMock.mockReturnValue(new Promise<SiteResult>(() => {}));
    goTo(`?step=risks&${POINT}`);

    renderApp();

    expect(risksView()).toBe("loading");
  });

  test("the risks screen shows the error when the site fails", async () => {
    getSiteMock.mockResolvedValue(networkError);
    goTo(`?step=risks&${POINT}`);

    renderApp();

    await waitFor(() => expect(risksView()).toBe("error"));
  });

  test("retrying from the risks screen asks for the site again", async () => {
    getSiteMock.mockResolvedValue(networkError);
    goTo(`?step=risks&${POINT}`);
    renderApp();
    await waitFor(() => expect(risksView()).toBe("error"));

    fireEvent.click(screen.getByText("risks-retry"));

    await waitFor(() => expect(getSiteMock).toHaveBeenCalledTimes(2));
  });

  test("closing the risks screen goes back to the map and keeps the point", () => {
    goTo(`?step=risks&${POINT}`);
    renderApp();

    fireEvent.click(screen.getByText("risks-close"));

    expect(params().get("step")).toBe("map");
    expect(params().get("lat")).toBe("14.7");
    expect(screen.getByTestId("map-screen")).toBeTruthy();
  });
});

describe("App form and results steps", () => {
  test("Ver recomendaciones on the map opens the form", () => {
    goTo(`?${POINT}`);
    renderApp();

    fireEvent.click(screen.getByText("view-recommendations"));

    expect(params().get("step")).toBe("form");
    expect(screen.getByTestId("results-flow")).toBeTruthy();
    expect(screen.queryByTestId("map-screen")).toBeNull();
  });

  test("Ver recomendaciones on the risks screen opens the form", () => {
    goTo(`?step=risks&${POINT}`);
    renderApp();

    fireEvent.click(screen.getByText("risks-continue"));

    expect(params().get("step")).toBe("form");
    expect(screen.getByTestId("results-flow")).toBeTruthy();
  });

  test("going back to the map from the form shows the map again", () => {
    goTo(`?step=form&${POINT}`);
    renderApp();

    fireEvent.click(screen.getByText("flow-back-to-map"));

    expect(params().get("step")).toBe("map");
    expect(screen.getByTestId("map-screen")).toBeTruthy();
    expect(screen.queryByTestId("results-flow")).toBeNull();
  });

  test("a form URL with a point shows the form and results flow", () => {
    goTo(`?step=form&${POINT}`);

    renderApp();

    expect(screen.getByTestId("results-flow")).toBeTruthy();
  });

  test("a results URL with a point shows the form and results flow", () => {
    goTo(`?step=results&${POINT}&p=maiz&s=frijol`);

    renderApp();

    expect(screen.getByTestId("results-flow")).toBeTruthy();
  });

  test.each(["risks", "form", "results"])(
    "step %s without a point goes back to the map",
    (step) => {
      goTo(`?step=${step}`);

      renderApp();

      expect(screen.getByTestId("map-screen")).toBeTruthy();
      expect(screen.queryByTestId("risks-screen")).toBeNull();
      expect(screen.queryByTestId("results-flow")).toBeNull();
      expect(getSiteMock).not.toHaveBeenCalled();
    },
  );
});

describe("App error boundary", () => {
  let consoleError: MockInstance;

  // React logs every error caught by a boundary; keep the test output clean.
  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  test("a crash on the map step shows a retry button that recovers the screen", () => {
    crash.map = true;
    renderApp();

    expect(screen.queryByTestId("map-screen")).toBeNull();
    const retry = screen.getByRole("button", { name: "Intentar de nuevo" });

    crash.map = false;
    fireEvent.click(retry);

    expect(screen.getByTestId("map-screen")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).toBeNull();
  });

  test("the boundary also covers the risks step", () => {
    crash.risks = true;
    goTo(`?step=risks&${POINT}`);
    renderApp();

    const retry = screen.getByRole("button", { name: "Intentar de nuevo" });
    crash.risks = false;
    fireEvent.click(retry);

    expect(screen.getByTestId("risks-screen")).toBeTruthy();
  });
});
