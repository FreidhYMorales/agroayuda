// web/src/features/map/copy.ts
import type { Lang } from "../../lib/urlState";
// Exact UI texts from the work package (Spanish, "usted"), plus their English version.

// The texts say "unos X km", so the size is rounded to the nearest 10 km
// (61.7 km reads as "unos 60 km"). Never below 10, so it never reads "unos 0 km".
function roundKm(km: number): number {
  return Math.max(10, Math.round(km / 10) * 10);
}

const ES = {
  defaultTitle: "Su zona",
  viewRisks: "Ver riesgos",
  viewRecommendations: "Ver recomendaciones →",
  pickPlace: "O elija un lugar: ›",
  zoneLine: (km: number) =>
    `Zona de unos ${roundKm(km)} km de lado (dato regional, no de su parcela)`,
  empty: "Toque el mapa o elija un lugar de la lista",
  slow: "Despertando el servidor, un momento…",
  outsideRegion: "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea.",
  geolocationDenied: "No pudimos ver su ubicación. Toque el mapa o elija un lugar.",
  mapError: "No pudimos cargar el mapa; elija un lugar de la lista",
  retry: "Intentar de nuevo",
  locate: "📍 Usar mi ubicación",
  rainCells: (km: number) => `celdas de unos ${roundKm(km)} km`,
  rainLow: "poca lluvia",
  rainHigh: "mucha",
  sourceLine: "Dato: NASA POWER ›",
};

const EN: typeof ES = {
  defaultTitle: "Your area",
  viewRisks: "See risks",
  viewRecommendations: "See recommendations →",
  pickPlace: "Or pick a place: ›",
  zoneLine: (km: number) => `Area about ${roundKm(km)} km across (regional data, not your plot)`,
  empty: "Tap the map or pick a place from the list",
  slow: "Waking up the server, one moment…",
  outsideRegion: "For now we only cover the Dry Corridor. Tap inside the line.",
  geolocationDenied: "We could not see your location. Tap the map or pick a place.",
  mapError: "We could not load the map; pick a place from the list",
  retry: "Try again",
  locate: "📍 Use my location",
  rainCells: (km: number) => `cells of about ${roundKm(km)} km`,
  rainLow: "little rain",
  rainHigh: "a lot",
  sourceLine: "Data: NASA POWER ›",
};

export function mapCopy(lang: Lang): typeof ES {
  return lang === "en" ? EN : ES;
}

// Spanish texts, for the callers that do not follow the language yet.
export const MAP_COPY = ES;
