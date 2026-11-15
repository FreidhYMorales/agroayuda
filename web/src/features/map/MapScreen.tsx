// web/src/features/map/MapScreen.tsx
import { type CSSProperties, useEffect, useState } from "react";
import { isAbortError } from "../../api/client";
import type { DemoPoint } from "../../contracts/contracts";
import { LocateButton } from "./LocateButton";
import { loadMapData, type MapData } from "./mapData";
import { MapStates } from "./MapStates";
import { MapView } from "./MapView";
import { RainLegend } from "./RainLegend";
import { RainSourceLine } from "./RainSourceLine";
import { SummaryCard } from "./SummaryCard";
import { DemoPlaceList } from "./DemoPlaceList";
import { mapCopy } from "./copy";
import { type Lang, useAppState, useLang } from "../../lib/urlState";
import { buttonStyle } from "../../ui/buttonStyles";
import { useGeolocation } from "./useGeolocation";
import type { SiteState } from "./useSite";
import { COLORS } from "../../ui/colors";

// A point chosen on the map, by geolocation or from the places list.
// `place` is the DemoPoint id, or undefined when the point did not come from
// the list. The key is always present, so merging it into the URL state
// removes any place that was selected before.
export interface MapSelection {
  lat: number;
  lon: number;
  place: string | undefined;
}

export interface MapScreenProps {
  // Already resolved by the parent, which calls useSite once and shares the
  // result with the risks screen so /site is requested a single time.
  site: SiteState;
  // Id of the demo place the current point came from, if any.
  placeId: string | undefined;
  places: DemoPoint[];
  onSelectPoint: (selection: MapSelection) => void;
  onRetry: () => void;
  onViewRisks: () => void;
  onViewRecommendations: () => void;
}

type MapDataState =
  | { status: "loading" }
  | { status: "ready"; data: MapData }
  | { status: "failed" };

// Layout from docs/spec.md "1. Map": the screen fills the phone height, the
// locate button stays on top, the map takes the free space with its legend on
// it, and the card lives in a bottom sheet that scrolls on its own, so the
// result of a tap is visible without scrolling the page.
// The layout itself lives in the ag-map-* classes (src/ui/layout.ts): on
// tablets, desktops and landscape phones the header and the sheet move into a
// side panel on the right and the map gets the full height. Only what is the
// same in every view stays inline here.
const headerStyle: CSSProperties = {
  padding: 12,
  backgroundColor: COLORS.background,
};
const headerRowStyle: CSSProperties = { display: "flex", alignItems: "center", gap: 8 };
const toggleStyle: CSSProperties = { display: "flex", flex: "none", gap: 4 };

// Language names are written in their own language, so each reader finds theirs.
const LANGUAGES: { lang: Lang; short: string; name: string }[] = [
  { lang: "es", short: "ES", name: "Español" },
  { lang: "en", short: "EN", name: "English" },
];

function LanguageToggle() {
  const lang = useLang();
  const [, setState] = useAppState();

  return (
    <div style={toggleStyle}>
      {LANGUAGES.map((option) => (
        <button
          key={option.lang}
          type="button"
          // Touch target of at least 44 px; the current language is the filled one.
          style={buttonStyle(option.lang === lang ? "primary" : "secondary")}
          aria-label={option.name}
          aria-pressed={option.lang === lang}
          // Spanish is the default, so it is kept out of the URL.
          onClick={() => setState({ lang: option.lang === "en" ? "en" : undefined })}
        >
          {option.short}
        </button>
      ))}
    </div>
  );
}

const mapOverlayStyle: CSSProperties = {
  position: "absolute",
  // Top corner: the bottom one belongs to the map attribution.
  left: 8,
  top: 8,
  width: "min(60%, 240px)",
  boxSizing: "border-box",
  display: "flex",
  flexDirection: "column",
  alignItems: "stretch",
  gap: 4,
  padding: 8,
  borderRadius: 8,
  background: "rgba(255, 255, 255, 0.9)",
  boxShadow: "0 1px 4px rgba(0, 0, 0, 0.2)",
};
// Height, corners and shadow change with the view, so they live in .ag-map-sheet.
const sheetStyle: CSSProperties = {
  overflowY: "auto",
  backgroundColor: COLORS.background,
};
// The handle means "drag up"; .ag-map-handle hides it in the side layout.
const handleStyle: CSSProperties = {
  alignSelf: "center",
  flex: "none",
  width: 40,
  height: 4,
  borderRadius: 2,
  background: COLORS.border,
};

export function MapScreen({
  site,
  placeId,
  places,
  onSelectPoint,
  onRetry,
  onViewRisks,
  onViewRecommendations,
}: MapScreenProps) {
  const copy = mapCopy(useLang());
  const [mapData, setMapData] = useState<MapDataState>({ status: "loading" });
  // Set when the basemap fails; MapView has already switched to the plain style.
  const [mapError, setMapError] = useState(false);
  // The list opened from "O elija un lugar: ›" on the summary card.
  const [listOpen, setListOpen] = useState(false);

  // A point found by geolocation never comes from the places list.
  const geolocation = useGeolocation((point) =>
    onSelectPoint({ lat: point.lat, lon: point.lon, place: undefined }),
  );

  useEffect(() => {
    const controller = new AbortController();

    loadMapData({ signal: controller.signal })
      .then((result) => {
        // Leaving the screen aborts the request: ignore any late answer.
        if (controller.signal.aborted) return;
        setMapData(result.ok ? { status: "ready", data: result.data } : { status: "failed" });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || isAbortError(error)) return;
        setMapData({ status: "failed" });
      });

    return () => controller.abort();
  }, []);

  // Tapping the map or picking a place is a new choice: any earlier
  // "location denied" message and an open list no longer apply.
  const selectFromMap = (point: { lat: number; lon: number }) => {
    geolocation.reset();
    setListOpen(false);
    onSelectPoint({ lat: point.lat, lon: point.lon, place: undefined });
  };

  const pickPlace = (place: DemoPoint) => {
    geolocation.reset();
    setListOpen(false);
    onSelectPoint({ lat: place.location.lat, lon: place.location.lon, place: place.id });
  };

  // Failing to load the map data is shown like a basemap failure: the places
  // list is the alternative that does not need the map.
  const mapErrorActive = mapError || mapData.status === "failed";

  // MapStates already shows the list in these cases; avoid a second copy.
  const statesShowList = site.status === "empty" || geolocation.denied || mapErrorActive;

  const selectedSite = site.status === "ready" ? site.site : null;
  const placeName = places.find((place) => place.id === placeId)?.name_es;
  // The layer metadata (source, cell size) is the same for every cell.
  const firstCell = mapData.status === "ready" ? mapData.data.rain.features[0] : undefined;

  return (
    <section className="ag-map-screen" aria-label={copy.defaultTitle}>
      <div className="ag-map-header" style={headerStyle}>
        <div style={headerRowStyle}>
          <div style={{ flex: "1 1 auto" }}>
            <LocateButton locating={geolocation.locating} onLocate={geolocation.locate} />
          </div>
          <LanguageToggle />
        </div>
      </div>

      {mapData.status === "ready" && (
        <div className="ag-map-area" data-testid="map-area">
          <MapView
            rain={mapData.data.rain}
            region={mapData.data.region}
            mask={mapData.data.mask}
            site={selectedSite}
            onSelectPoint={selectFromMap}
            onError={() => setMapError(true)}
          />
          <div style={mapOverlayStyle}>
            <RainLegend />
            {firstCell !== undefined && <RainSourceLine properties={firstCell.properties} />}
          </div>
        </div>
      )}

      <div className="ag-map-sheet" style={sheetStyle} data-testid="map-sheet">
        <div className="ag-map-handle" style={handleStyle} aria-hidden="true" />

        <MapStates
          site={site}
          geolocationDenied={geolocation.denied}
          mapError={mapErrorActive}
          places={places}
          onRetry={onRetry}
          onPickPlace={pickPlace}
        />

        {site.status === "ready" && (
          <SummaryCard
            site={site.site}
            placeName={placeName}
            onViewRisks={onViewRisks}
            onViewRecommendations={onViewRecommendations}
            onPickPlace={() => setListOpen(true)}
          />
        )}

        {listOpen && !statesShowList && <DemoPlaceList places={places} onPick={pickPlace} />}
      </div>
    </section>
  );
}
