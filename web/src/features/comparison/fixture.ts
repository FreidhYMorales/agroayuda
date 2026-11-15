import type { RotationOption } from "../../contracts/contracts";

/** Illustrative options from the work package (not engine output): current, recommended, not. */
export const FIXTURE_OPTIONS: RotationOption[] = [
  {
    sequence: { primera: "maiz", postrera: "frijol" },
    is_current: true,
    recommended: false,
    not_recommended_reason: "Aguanta poco la sequía de la canícula",
    not_recommended_reason_en: "Cannot take much drought in the canícula",
    bare_months: [12, 1, 2, 3, 4],
    criteria: { water: 3, soil: 3, income: 3, risk: 2 },
    delta_vs_current: { water: "same", soil: "same", income: "same", risk: "same" },
    confidence: "medium",
    reasons: ["Es lo que usted siembra ahora."],
    reasons_en: ["It is what you plant now."],
    evidence: [
      {
        text_es: "Canícula fuerte en 21 de 30 años",
        text_en: "Strong canícula in 21 of 30 years",
        dataset: "NASA POWER",
        value: "0.70",
        value_en: "0.70",
      },
    ],
    benefits: ["Cultivos que usted ya conoce."],
    benefits_en: ["Crops you already know."],
    data_gaps: ["La lluvia de NASA POWER es una estimación regional."],
    data_gaps_en: ["NASA POWER rain is a regional estimate."],
    local_review: ["Consulte con un técnico si su variedad de maíz aguanta la canícula."],
    local_review_en: ["Ask a technician whether your maize variety can take the canícula."],
  },
  {
    sequence: { primera: "maiz_frijol", postrera: "maicillo" },
    is_current: false,
    recommended: true,
    not_recommended_reason: null,
    not_recommended_reason_en: null,
    bare_months: [1, 2, 3, 4],
    criteria: { water: 4, soil: 4, income: 3, risk: 3 },
    delta_vs_current: { water: "better", soil: "better", income: "same", risk: "better" },
    confidence: "medium",
    reasons: ["Ahorra más agua, que es lo más importante para usted."],
    reasons_en: ["Saves more water, which matters most to you."],
    evidence: [
      {
        text_es: "Canícula fuerte en 21 de 30 años",
        text_en: "Strong canícula in 21 of 30 years",
        dataset: "NASA POWER",
        value: "0.70",
        value_en: "0.70",
      },
    ],
    benefits: ["El frijol en asocio aporta nitrógeno al suelo."],
    benefits_en: ["Beans grown together add nitrogen to the soil."],
    data_gaps: ["Valor general del maicillo; validar localmente."],
    data_gaps_en: ["General value for sorghum; check locally."],
    local_review: ["Consulte con un técnico qué variedad de maicillo conviene."],
    local_review_en: ["Ask a technician which sorghum variety suits you."],
  },
  {
    sequence: { primera: "frijol", postrera: "maicillo" },
    is_current: false,
    recommended: false,
    not_recommended_reason: "Aguanta poco la sequía de la canícula",
    not_recommended_reason_en: "Cannot take much drought in the canícula",
    bare_months: [1, 2, 3, 4, 8],
    criteria: { water: 4, soil: 3, income: 2, risk: 2 },
    delta_vs_current: { water: "better", soil: "same", income: "worse", risk: "same" },
    confidence: "low",
    reasons: ["Ahorra agua."],
    reasons_en: ["Saves water."],
    evidence: [],
    benefits: ["Menos riego."],
    benefits_en: ["Less irrigation."],
    data_gaps: ["Valores de cultivo generales (FAO)."],
    data_gaps_en: ["General crop values (FAO)."],
    local_review: ["Consulte con un técnico."],
    local_review_en: ["Ask a technician."],
  },
];

/** Same options with nothing recommended (the current rotation is the best one). */
export function withoutRecommended(options: RotationOption[]): RotationOption[] {
  return options.map((option) => ({ ...option, recommended: false }));
}
