import type { RotationOption } from "../../contracts/contracts";

/** Illustrative options from the work package (not engine output): current, recommended, not. */
export const FIXTURE_OPTIONS: RotationOption[] = [
  {
    sequence: { primera: "maiz", postrera: "frijol" },
    is_current: true,
    recommended: false,
    not_recommended_reason: "Aguanta poco la sequía de la canícula",
    bare_months: [12, 1, 2, 3, 4],
    criteria: { water: 3, soil: 3, income: 3, risk: 2 },
    delta_vs_current: { water: "same", soil: "same", income: "same", risk: "same" },
    confidence: "medium",
    reasons: ["Es lo que usted siembra ahora."],
    evidence: [
      { text_es: "Canícula fuerte en 21 de 30 años", dataset: "NASA POWER", value: "0.70" },
    ],
    benefits: ["Cultivos que usted ya conoce."],
    data_gaps: ["La lluvia de NASA POWER es una estimación regional."],
    local_review: ["Consulte con un técnico si su variedad de maíz aguanta la canícula."],
  },
  {
    sequence: { primera: "maiz_frijol", postrera: "maicillo" },
    is_current: false,
    recommended: true,
    not_recommended_reason: null,
    bare_months: [1, 2, 3, 4],
    criteria: { water: 4, soil: 4, income: 3, risk: 3 },
    delta_vs_current: { water: "better", soil: "better", income: "same", risk: "better" },
    confidence: "medium",
    reasons: ["Ahorra más agua, que es lo más importante para usted."],
    evidence: [
      { text_es: "Canícula fuerte en 21 de 30 años", dataset: "NASA POWER", value: "0.70" },
    ],
    benefits: ["El frijol en asocio aporta nitrógeno al suelo."],
    data_gaps: ["Valor general del maicillo; validar localmente."],
    local_review: ["Consulte con un técnico qué variedad de maicillo conviene."],
  },
  {
    sequence: { primera: "frijol", postrera: "maicillo" },
    is_current: false,
    recommended: false,
    not_recommended_reason: "Aguanta poco la sequía de la canícula",
    bare_months: [1, 2, 3, 4, 8],
    criteria: { water: 4, soil: 3, income: 2, risk: 2 },
    delta_vs_current: { water: "better", soil: "same", income: "worse", risk: "same" },
    confidence: "low",
    reasons: ["Ahorra agua."],
    evidence: [],
    benefits: ["Menos riego."],
    data_gaps: ["Valores de cultivo generales (FAO)."],
    local_review: ["Consulte con un técnico."],
  },
];

/** Same options with nothing recommended (the current rotation is the best one). */
export function withoutRecommended(options: RotationOption[]): RotationOption[] {
  return options.map((option) => ({ ...option, recommended: false }));
}
