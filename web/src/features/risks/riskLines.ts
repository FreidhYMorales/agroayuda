// web/src/features/risks/riskLines.ts
import type { SiteRisk } from "../../contracts/contracts";

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const YEARS_WINDOW = 30; // 1991-2020

function monthName(month: number): string {
  return MONTHS[month - 1] ?? "";
}

// e.g. "mediados jul-ago", "dic-abr (estimado)", "abr". Empty if there are no months.
export function riskPeriod(risk: SiteRisk): string {
  const first = risk.period_months[0];
  const last = risk.period_months[risk.period_months.length - 1];
  if (first === undefined || last === undefined) return "";

  const range = first === last ? monthName(first) : `${monthName(first)}-${monthName(last)}`;
  const period = risk.id === "canicula" ? `mediados ${range}` : range;
  return risk.estimated ? `${period} (estimado)` : period;
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
