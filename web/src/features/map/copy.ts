// web/src/features/map/copy.ts
// Textos exactos del paquete.
export const MAP_COPY = {
  defaultTitle: "Su zona",
  viewRisks: "Ver riesgos",
  viewRecommendations: "Ver recomendaciones →",
  pickPlace: "O elija un lugar: ›",
  zoneLine: (km: number) => `Zona de unos ${km} km de lado (dato regional, no de su parcela)`,
  empty: "Toque el mapa o elija un lugar de la lista",
  slow: "Despertando el servidor, un momento…",
  outsideRegion: "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea.",
  geolocationDenied: "No pudimos ver su ubicación. Toque el mapa o elija un lugar.",
  mapError: "No pudimos cargar el mapa; elija un lugar de la lista",
  retry: "Intentar de nuevo",
} as const;
