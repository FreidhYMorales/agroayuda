// web/src/features/risks/riskTitle.ts
import type { SiteRisk } from "../../contracts/contracts";

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

export function riskTitle(risk: SiteRisk): string {
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
