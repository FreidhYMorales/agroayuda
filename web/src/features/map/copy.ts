// web/src/features/map/copy.ts
// Textos exactos del paquete. Más adelante se suman aquí los de los estados del mapa.
export const MAP_COPY = {
  defaultTitle: "Su zona",
  viewRisks: "Ver riesgos",
  viewRecommendations: "Ver recomendaciones →",
  pickPlace: "O elija un lugar: ›",
  zoneLine: (km: number) => `Zona de unos ${km} km de lado (dato regional, no de su parcela)`,
} as const;
