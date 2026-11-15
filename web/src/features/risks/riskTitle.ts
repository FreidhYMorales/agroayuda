// web/src/features/risks/riskTitle.ts
import type { SiteRisk } from "../../contracts/contracts";

// Lower number = more severe. "unknown" goes last.
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
      return "Canícula"; // no copy in the package: base title
    case "bare_field":
      return "Suelo sin cultivo";
    case "heat":
      return "Calor"; // no copy in the package: to be confirmed with the lead
    case "missing_data":
      return "❔ Suelo: sin dato";
  }
}

export function sortRisks(risks: SiteRisk[]): SiteRisk[] {
  // Sorted copy; Array.prototype.sort is stable, so levels
  // that are equal keep their original order.
  return [...risks].sort((a, b) => SEVERITY[a.level] - SEVERITY[b.level]);
}
