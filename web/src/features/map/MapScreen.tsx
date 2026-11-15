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
import { MAP_COPY } from "./copy";
import { useGeolocation } from "./useGeolocation";
import type { SiteState } from "./useSite";

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

const screenStyle: CSSProperties = { display: "flex", flexDirection: "column", height: "100%" };
const mapAreaStyle: CSSProperties = { height: "55vh", minHeight: 240 };
const panelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 12,
  padding: 12,
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
    <section style={screenStyle} aria-label={MAP_COPY.defaultTitle}>
      {mapData.status === "ready" && (
        <div style={mapAreaStyle}>
          <MapView
            rain={mapData.data.rain}
            region={mapData.data.region}
            site={selectedSite}
            onSelectPoint={selectFromMap}
            onError={() => setMapError(true)}
          />
        </div>
      )}

      <div style={panelStyle}>
        <LocateButton locating={geolocation.locating} onLocate={geolocation.locate} />

        {mapData.status === "ready" && <RainLegend />}
        {firstCell !== undefined && <RainSourceLine properties={firstCell.properties} />}

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
