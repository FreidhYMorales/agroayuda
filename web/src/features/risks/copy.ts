// web/src/features/risks/copy.ts
// Risks screen texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  header: "Riesgos de esta zona",
  headerAt: (place: string) => `Riesgos en ${place}`,
  back: "← Su parcela",
  noStrongRisk: "No encontramos riesgos fuertes en esta zona",
  continue: "Ver recomendaciones →",
  retry: "Intentar de nuevo",
};

const EN: typeof ES = {
  header: "Risks in this area",
  headerAt: (place: string) => `Risks in ${place}`,
  back: "← Your plot",
  noStrongRisk: "We found no strong risks in this area",
  continue: "See recommendations →",
  retry: "Try again",
};

export function risksCopy(lang: Lang): typeof ES {
  return lang === "en" ? EN : ES;
}
