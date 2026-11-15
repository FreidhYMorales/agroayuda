// web/src/features/risks/riskLines.ts
import type { SiteRisk } from "../../contracts/contracts";
import type { Lang } from "../../lib/urlState";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_EN = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const PERIOD_WORDS = {
  es: { mid: "mediados", estimated: "estimado" },
  en: { mid: "mid", estimated: "estimated" },
};
const YEARS_WINDOW = 30; // 1991-2020

function monthName(month: number, lang: Lang): string {
  return (lang === "en" ? MONTHS_EN : MONTHS)[month - 1] ?? "";
}

// "mediados jul-ago", "dic-abr (estimado)", "abr". Empty when there are no months.
export function riskPeriod(risk: SiteRisk, lang: Lang = "es"): string {
  const first = risk.period_months[0];
  const last = risk.period_months[risk.period_months.length - 1];
  if (first === undefined || last === undefined) return "";

  const words = PERIOD_WORDS[lang];
  const range =
    first === last ? monthName(first, lang) : `${monthName(first, lang)}-${monthName(last, lang)}`;
  const period = risk.id === "canicula" ? `${words.mid} ${range}` : range;
  return risk.estimated ? `${period} (${words.estimated})` : period;
}

// "NASA POWER (PRECTOTCORR diario, 1991-2020)" -> "NASA POWER"
function shortSource(source: string): string {
  return source.replace(/\s*\(.*\)\s*$/, "");
}

export function riskSourceLine(risk: SiteRisk): string {
  const base = `Dato: ${shortSource(risk.source)}`;

  if (risk.id === "canicula" && risk.value !== null) {
    return `${base} · en ${Math.round(risk.value * YEARS_WINDOW)} de ${YEARS_WINDOW} años`;
  }
  if (risk.id === "missing_data") {
    return `${base} · muestra cerca del centro de la zona`;
  }
  return base;
}
