// web/src/features/risks/riskTitle.ts
import type { SiteRisk } from "../../contracts/contracts";

// Menor número = más grave. "unknown" va al final.
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
      return "Calor"; // sin copy en el paquete: pendiente de confirmar con el lead
    case "missing_data":
      return "❔ Suelo: sin dato";
  }
}

export function sortRisks(risks: SiteRisk[]): SiteRisk[] {
  // Copia ordenada; Array.prototype.sort es estable, así que los niveles
  // iguales conservan su orden original.
  return [...risks].sort((a, b) => SEVERITY[a.level] - SEVERITY[b.level]);
}
