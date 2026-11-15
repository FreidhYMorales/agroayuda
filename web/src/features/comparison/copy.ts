// web/src/features/comparison/copy.ts
// Comparison screen texts in Spanish (Guatemala, "usted") and their English version.
import type { Lang } from "../../lib/urlState";

const ES = {
  back: "← Sus opciones",
  columnTitles: ["Actual", "Op.1", "Op.2"] as readonly [string, string, string],
  criteria: { water: "Agua", soil: "Suelo", income: "Ingreso", risk: "Riesgo" },
  criterion: "Criterio",
  confidence: "Confianza",
  bareMonths: "Meses sin cultivo",
  recommendedNote: (title: string, sequence: string) => `✓ Recomendada: ${title} (${sequence})`,
  warningNote: (title: string, reason: string) => `⚠ ${title}: ${reason}`,
  notRecommendedNote: (title: string, reason: string) => `✗ ${title} no recomendada: ${reason}`,
  tapOption: "Toque una opción ›",
  aid: "ⓘ Esto es una ayuda; no reemplaza su criterio",
  changePriorities: "Cambiar prioridades",
};

const EN: typeof ES = {
  back: "← Your options",
  columnTitles: ["Current", "Opt. 1", "Opt. 2"],
  criteria: { water: "Water", soil: "Soil", income: "Income", risk: "Risk" },
  criterion: "Criterion",
  confidence: "Confidence",
  bareMonths: "Months without a crop",
  recommendedNote: (title, sequence) => `✓ Recommended: ${title} (${sequence})`,
  warningNote: (title, reason) => `⚠ ${title}: ${reason}`,
  notRecommendedNote: (title, reason) => `✗ ${title} not recommended: ${reason}`,
  tapOption: "Tap an option ›",
  aid: "ⓘ This is an aid; it does not replace your judgment",
  changePriorities: "Change priorities",
};

export function comparisonCopy(lang: Lang): typeof ES {
  return lang === "en" ? EN : ES;
}
