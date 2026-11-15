// web/src/features/risks/riskTitle.ts
import type { SiteRisk } from "../../contracts/contracts";

// Menor número = más grave. "unknown" va al final.
const SEVERITY: Record<SiteRisk["level"], number> = {
  high: 0,
  medium: 1,
  low: 2,
  unknown: 3,
};

export function riskTitle(risk: SiteRisk): string {
  switch (risk.id) {
    case "canicula":
      if (risk.level === "high") return "Canícula fuerte";
      if (risk.level === "medium") return "Canícula moderada";
      return "Canícula"; // sin copy en el paquete: título base
    case "bare_field":
      return "Suelo sin cultivo";
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
