import type { DeltaVsCurrent, RotationOption } from "../../contracts/contracts";
import type { Lang } from "../../lib/urlState";

export type Delta = DeltaVsCurrent["water"];

export type Badge = {
  kind: "recommended" | "not_recommended" | "warning" | "none";
  text: string;
};

// The reason after "not recommended" comes from the API and is shown as sent.
const BADGE_WORDS = {
  es: {
    recommended: "✓ Recomendada",
    notRecommended: "✗ No recomendada",
    best: "Su rotación actual ya es la mejor para sus prioridades",
    caniculaSuffix: ", pero tenga cuidado con la canícula",
  },
  en: {
    recommended: "✓ Recommended",
    notRecommended: "✗ Not recommended",
    best: "Your current rotation is already the best for your priorities",
    caniculaSuffix: ", but watch out for the canícula",
  },
};

export const BEST_CURRENT_MESSAGE = BADGE_WORDS.es.best;
export const CANICULA_SUFFIX = BADGE_WORDS.es.caniculaSuffix;

/** Badge of one column: ✓ recommended, ✗ not recommended (+ reason), ⚠ on the current one. */
export function columnBadge(option: RotationOption, lang: Lang = "es"): Badge {
  const words = BADGE_WORDS[lang];
  const reason = option.not_recommended_reason;
  if (option.is_current) {
    return reason ? { kind: "warning", text: `⚠ ${reason}` } : { kind: "none", text: "" };
  }
  if (option.recommended) {
    return { kind: "recommended", text: words.recommended };
  }
  if (reason) {
    return { kind: "not_recommended", text: `${words.notRecommended}: ${reason}` };
  }
  return { kind: "none", text: "" };
}

/** Message shown when no option is recommended; null when there is a recommended one. */
export function summaryMessage(options: RotationOption[], lang: Lang = "es"): string | null {
  if (options.length === 0 || options.some((option) => option.recommended)) {
    return null;
  }
  const current = options.find((option) => option.is_current);
  const warned = current !== undefined && columnBadge(current).kind === "warning";
  const words = BADGE_WORDS[lang];
  return warned ? `${words.best}${words.caniculaSuffix}` : words.best;
}

export function deltaText(d: Delta): string {
  if (d === "better") return "▲ mejor";
  if (d === "worse") return "▼ menos";
  return "= igual";
}

/** Confidence as dots plus a word, so it never relies on color alone. */
const CONFIDENCE_WORDS = {
  es: { high: "alta", medium: "media", low: "baja" },
  en: { high: "high", medium: "medium", low: "low" },
};

export function confidenceText(
  confidence: RotationOption["confidence"],
  lang: Lang = "es",
): string {
  const words = CONFIDENCE_WORDS[lang];
  if (confidence === "high") return `●●● ${words.high}`;
  if (confidence === "medium") return `●●○ ${words.medium}`;
  return `●○○ ${words.low}`;
}
