// web/src/features/map/copy.ts
// Exact UI texts from the work package (Spanish, "usted").

// The texts say "unos X km", so the size is rounded to the nearest 10 km
// (61.7 km reads as "unos 60 km"). Never below 10, so it never reads "unos 0 km".
function roundKm(km: number): number {
  return Math.max(10, Math.round(km / 10) * 10);
}

export const MAP_COPY = {
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
  locate: "📍 ¿Dónde está su parcela?",
  rainCells: (km: number) => `celdas de unos ${roundKm(km)} km`,
  rainLow: "poca lluvia",
  rainHigh: "mucha",
  sourceLine: "Dato: NASA POWER ›",
} as const;
