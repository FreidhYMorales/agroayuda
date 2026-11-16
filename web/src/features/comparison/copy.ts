// web/src/features/comparison/copy.ts
// Comparison screen texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  // Back labels name where they lead.
  back: "← Sus cultivos",
  backToComparison: "← Comparación",
  columnTitles: ["Actual", "Op.1", "Op.2"] as readonly [string, string, string],
  detailTitles: ["Actual", "Opción 1", "Opción 2"] as readonly [string, string, string],
  // Same words as the form priorities, so a higher score always reads as better.
  criteria: {
    water: "Ahorrar agua",
    soil: "Cuidar suelo",
    income: "Ganar más",
    risk: "Menos riesgo",
  },
  scaleNote: "Puntaje de 1 a 5: 5 es lo mejor",
  criterion: "Criterio",
  confidence: "Confianza",
  bareMonths: "Meses sin cultivo (menos es mejor)",
  recommendedNote: (title: string, sequence: string) => `✓ Recomendada: ${title} (${sequence})`,
  warningNote: (title: string, reason: string) => `⚠ ${title}: ${reason}`,
  notRecommendedNote: (title: string, reason: string) => `✗ ${title} no recomendada: ${reason}`,
  tapOption: "👆 Toque una opción para ver por qué",
  aid: "ⓘ Esto es una ayuda; no reemplaza su criterio",
  changePriorities: "Cambiar prioridades",
  loading: "Cargando las opciones…",
  slow: "Despertando el servidor…",
  loadError: "No pudimos traer sus opciones.",
  retry: "Intentar de nuevo",
};

const EN: typeof ES = {
  back: "← Your crops",
  backToComparison: "← Comparison",
  columnTitles: ["Current", "Opt. 1", "Opt. 2"],
  detailTitles: ["Current", "Option 1", "Option 2"],
  criteria: {
    water: "Save water",
    soil: "Care for the soil",
    income: "Earn more",
    risk: "Less risk",
  },
  scaleNote: "Score from 1 to 5: 5 is best",
  criterion: "Criterion",
  confidence: "Confidence",
  bareMonths: "Months without a crop (fewer is better)",
  recommendedNote: (title, sequence) => `✓ Recommended: ${title} (${sequence})`,
  warningNote: (title, reason) => `⚠ ${title}: ${reason}`,
  notRecommendedNote: (title, reason) => `✗ ${title} not recommended: ${reason}`,
  tapOption: "👆 Tap an option to see why",
  aid: "ⓘ This is an aid; it does not replace your judgment",
  changePriorities: "Change priorities",
  loading: "Loading the options…",
  slow: "Waking up the server, one moment…",
  loadError: "We could not get your options.",
  retry: "Try again",
};

export function comparisonCopy(lang: Lang): typeof ES {
  return lang === "en" ? EN : ES;
}
