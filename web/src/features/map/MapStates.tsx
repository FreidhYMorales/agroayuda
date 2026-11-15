// web/src/features/map/MapStates.tsx
import type { CSSProperties } from "react";
import type { DemoPoint } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";
import { mapCopy } from "./copy";
import { useLang } from "../../lib/urlState";
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
// Áreas táctiles >= 44 px.
const retryStyle = buttonStyle("secondary");

export function MapStates({
  site,
  geolocationDenied,
  mapError,
  places,
  onRetry,
  onPickPlace,
}: MapStatesProps) {
  const copy = mapCopy(useLang());
  // El mensaje de vacío sería engañoso si ya hay un aviso más específico.
  const showEmpty = site.status === "empty" && !geolocationDenied && !mapError;
  // La lista es la alternativa sin mapa: visible siempre que el texto diga "elija un lugar".
  const showList = site.status === "empty" || geolocationDenied || mapError;

  return (
    <>
      {mapError && <p role="alert">{copy.mapError}</p>}
      {geolocationDenied && <p role="alert">{copy.geolocationDenied}</p>}
      {showEmpty && <p>{copy.empty}</p>}

      {site.status === "loading" && (
        <div>
          <div data-testid="map-loading-card" aria-busy="true" style={loadingCardStyle} />
          {site.slow && <p role="status">{copy.slow}</p>}
        </div>
      )}

      {site.status === "error" && site.error === "outside_region" && (
        <p role="alert">{copy.outsideRegion}</p>
      )}
      {site.status === "error" && site.error !== "outside_region" && (
        <div style={panelStyle}>
          <button type="button" style={retryStyle} onClick={onRetry}>
            {copy.retry}
          </button>
        </div>
      )}

      {showList && <DemoPlaceList places={places} onPick={onPickPlace} />}
    </>
  );
}
