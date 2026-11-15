// web/src/features/risks/riskTitle.ts
import type { SiteRisk } from "../../contracts/contracts";
import type { Lang } from "../../lib/urlState";

// Lower number = more severe. "unknown" goes last.
const SEVERITY: Record<SiteRisk["level"], number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

// The level must be readable as text, not only from the badge color.
const BARE_FIELD_LEVEL: Partial<Record<SiteRisk["level"], string>> = {
  high: "alto",
  medium: "moderado",
  low: "bajo",
};

// English names the level with the same words for every risk; canícula keeps
// the local word so it matches the map and the data.
const LEVEL_EN: Partial<Record<SiteRisk["level"], string>> = {
  high: "Strong",
  medium: "Moderate",
  low: "Mild",
};
const BARE_FIELD_LEVEL_EN: Partial<Record<SiteRisk["level"], string>> = {
  high: "high",
  medium: "moderate",
  low: "low",
};

function riskTitleEn(risk: SiteRisk): string {
  const level = LEVEL_EN[risk.level];
  switch (risk.id) {
    case "canicula":
      return level === undefined ? "Dry spell (canícula)" : `${level} dry spell (canícula)`;
    case "bare_field": {
      const bare = BARE_FIELD_LEVEL_EN[risk.level];
      return bare === undefined ? "Bare field" : `Bare field · ${bare}`;
    }
    case "heat":
      return level === undefined ? "Heat" : `${level} heat`;
    case "missing_data":
      return "❔ Soil: no data";
  }
}

export function riskTitle(risk: SiteRisk, lang: Lang = "es"): string {
  if (lang === "en") return riskTitleEn(risk);
  switch (risk.id) {
    case "canicula":
      if (risk.level === "high") return "Canícula fuerte";
      if (risk.level === "medium") return "Canícula moderada";
      // "Canícula baja" comes from the map wireframe in docs/spec.md.
      if (risk.level === "low") return "Canícula baja";
      return "Canícula";
    case "bare_field": {
      const level = BARE_FIELD_LEVEL[risk.level];
      return level === undefined ? "Suelo sin cultivo" : `Suelo sin cultivo · ${level}`;
    }
    case "heat":
      // "Calor moderado" comes from the risks wireframe in docs/spec.md.
      if (risk.level === "high") return "Calor fuerte";
      if (risk.level === "medium") return "Calor moderado";
      if (risk.level === "low") return "Calor bajo";
      return "Calor";
    case "missing_data":
      return "❔ Suelo: sin dato";
  }
}

export function sortRisks(risks: SiteRisk[]): SiteRisk[] {
  // Sorted copy; Array.prototype.sort is stable, so equal levels
  // keep their original order.
  return [...risks].sort((a, b) => SEVERITY[a.level] - SEVERITY[b.level]);
}
