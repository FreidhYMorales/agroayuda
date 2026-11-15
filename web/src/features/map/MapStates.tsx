// web/src/features/map/MapStates.tsx
import type { CSSProperties } from "react";
import type { DemoPoint } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";
import { MAP_COPY } from "./copy";
import { DemoPlaceList } from "./DemoPlaceList";
import type { SiteState } from "./useSite";

export interface MapStatesProps {
  site: SiteState;
  geolocationDenied: boolean;
  mapError: boolean;
  places: DemoPoint[];
  onRetry: () => void;
  onPickPlace: (place: DemoPoint) => void;
}

const panelStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "#ffffff",
  color: "#1a1a1a",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
};
const loadingCardStyle: CSSProperties = {
  height: 120,
  borderRadius: 12,
  background: "#e0e0e0",
};
// Touch targets of at least 44 px.
const retryStyle = buttonStyle("secondary");

export function MapStates({
  site,
  geolocationDenied,
  mapError,
  places,
  onRetry,
  onPickPlace,
}: MapStatesProps) {
  // The empty message would mislead when a more specific notice is already shown.
  const showEmpty = site.status === "empty" && !geolocationDenied && !mapError;
  // The list is the no-map fallback: shown whenever the text says "elija un lugar".
  const showList = site.status === "empty" || geolocationDenied || mapError;

  return (
    <>
      {mapError && <p role="alert">{MAP_COPY.mapError}</p>}
      {geolocationDenied && <p role="alert">{MAP_COPY.geolocationDenied}</p>}
      {showEmpty && <p>{MAP_COPY.empty}</p>}

      {site.status === "loading" && (
        <div>
          <div data-testid="map-loading-card" aria-busy="true" style={loadingCardStyle} />
          {site.slow && <p role="status">{MAP_COPY.slow}</p>}
        </div>
      )}

      {site.status === "error" && site.error === "outside_region" && (
        <p role="alert">{MAP_COPY.outsideRegion}</p>
      )}
      {site.status === "error" && site.error !== "outside_region" && (
        <div style={panelStyle}>
          <button type="button" style={retryStyle} onClick={onRetry}>
            {MAP_COPY.retry}
          </button>
        </div>
      )}

      {showList && <DemoPlaceList places={places} onPick={onPickPlace} />}
    </>
  );
}
