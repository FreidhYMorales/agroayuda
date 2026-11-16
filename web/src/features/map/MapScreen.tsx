// web/src/features/map/MapScreen.tsx
import { type CSSProperties, useEffect, useRef, useState } from "react";
import { isAbortError } from "../../api/client";
import type { DemoPoint } from "../../contracts/contracts";
import { LanguageToggle } from "./LanguageToggle";
import { LocateButton } from "./LocateButton";
import { SheetHandle } from "./SheetHandle";
import { clampSheetHeight } from "./sheetSize";
import { loadMapData, type MapData } from "./mapData";
import { MapStates } from "./MapStates";
import { MapView } from "./MapView";
import { RainLegend } from "./RainLegend";
import { RainSourceLine } from "./RainSourceLine";
import { SummaryCard } from "./SummaryCard";
import { DemoPlaceList } from "./DemoPlaceList";
import { mapCopy } from "./copy";
import { useLang } from "../../lib/urlState";
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
// At 200% zoom (about 180 CSS px) ES/EN wrap below the locate button instead of
// leaving the screen; with the locate box growing from 0 this never happens at 320 px.
const headerRowStyle: CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
};
// Height, corners and shadow change with the view, so they live in .ag-map-sheet.
const sheetStyle: CSSProperties = {
  overflowY: "auto",
  backgroundColor: COLORS.background,
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
  // Phone sheet at half (default) or most of the screen; ignored in the side layout.
  const [expanded, setExpanded] = useState(false);
  // Height in px after a drag on the handle (free sheet); null = the fixed sizes above.
  const [sheetHeight, setSheetHeight] = useState<number | null>(null);
  const screenRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragStart = useRef({ sheet: 0, available: 0 });

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
    <section ref={screenRef} className="ag-map-screen" aria-label={copy.defaultTitle}>
      <div ref={headerRef} className="ag-map-header" style={headerStyle}>
        <div style={headerRowStyle}>
          <div style={{ flex: "1 1 0" }}>
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
          <div className="ag-map-legend">
            <RainLegend />
            {firstCell !== undefined && <RainSourceLine properties={firstCell.properties} />}
          </div>
        </div>
      )}

      <div
        ref={sheetRef}
        id="map-sheet"
        className="ag-map-sheet"
        style={
          sheetHeight === null
            ? sheetStyle
            : ({ ...sheetStyle, "--ag-sheet-h": `${sheetHeight}px` } as CSSProperties)
        }
        data-testid="map-sheet"
        data-expanded={expanded}
        data-free={sheetHeight === null ? undefined : "true"}
      >
        <SheetHandle
          expanded={expanded}
          controls="map-sheet"
          onChange={(next) => {
            // A tap goes back to the fixed sizes.
            setSheetHeight(null);
            setExpanded(next);
          }}
          onDragStart={() => {
            const height = (element: HTMLElement | null) =>
              element?.getBoundingClientRect().height ?? 0;
            dragStart.current = {
              sheet: height(sheetRef.current),
              available: height(screenRef.current) - height(headerRef.current),
            };
          }}
          onDrag={(dy) => {
            const { sheet, available } = dragStart.current;
            const next = clampSheetHeight(sheet - dy, available);
            setSheetHeight(next);
            // Past the middle the next tap should shrink it, before it should grow it.
            setExpanded(next > available / 2);
          }}
        />

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
