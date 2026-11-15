import type { DeltaVsCurrent, RotationOption } from "../../contracts/contracts";
import type { Lang } from "../../lib/urlState";

export type Delta = DeltaVsCurrent["water"];

export type Badge = {
  kind: "recommended" | "not_recommended" | "warning" | "none";
  text: string;
};

export const BEST_CURRENT_MESSAGE = "Su rotación actual ya es la mejor para sus prioridades";
export const CANICULA_SUFFIX = ", pero tenga cuidado con la canícula";

/** Badge of one column: ✓ recommended, ✗ not recommended (+ reason), ⚠ on the current one. */
export function columnBadge(option: RotationOption): Badge {
  const reason = option.not_recommended_reason;
  if (option.is_current) {
    return reason ? { kind: "warning", text: `⚠ ${reason}` } : { kind: "none", text: "" };
  }
  if (option.recommended) {
    return { kind: "recommended", text: "✓ Recomendada" };
  }
  if (reason) {
    return { kind: "not_recommended", text: `✗ No recomendada: ${reason}` };
  }
  return { kind: "none", text: "" };
}

/** Message shown when no option is recommended; null when there is a recommended one. */
export function summaryMessage(options: RotationOption[]): string | null {
  if (options.length === 0 || options.some((option) => option.recommended)) {
    return null;
  }
  const current = options.find((option) => option.is_current);
  const warned = current !== undefined && columnBadge(current).kind === "warning";
  return warned ? `${BEST_CURRENT_MESSAGE}${CANICULA_SUFFIX}` : BEST_CURRENT_MESSAGE;
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
