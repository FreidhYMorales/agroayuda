// web/src/features/risks/RiskRow.tsx
import type { CSSProperties } from "react";
import type { SiteRisk } from "../../contracts/contracts";
import { riskPeriod, riskSourceLine } from "./riskLines";
import { riskTitle } from "./riskTitle";

const LEVEL_ICON: Record<SiteRisk["level"], string> = {
  high: "⚠",
  medium: "◐",
  low: "✓",
  unknown: "❔",
};

// El título de "datos faltantes" ya trae su propio ❔: no se repite el ícono.
function riskIcon(risk: SiteRisk): string | null {
  return riskTitle(risk).startsWith("❔") ? null : LEVEL_ICON[risk.level];
}

const rowStyle: CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #d0d0d0",
  listStyle: "none",
};
const titleStyle: CSSProperties = { fontWeight: 600 };
const detailStyle: CSSProperties = { fontSize: "0.875rem", marginTop: 2 };

export function RiskRow({ risk }: { risk: SiteRisk }) {
  const icon = riskIcon(risk);
  const period = riskPeriod(risk);

  return (
    <li style={rowStyle}>
      <div style={titleStyle}>
        {icon !== null && <span aria-hidden="true">{icon} </span>}
        {riskTitle(risk)}
      </div>
      {period !== "" && <div style={detailStyle}>{period}</div>}
      <div style={detailStyle}>{riskSourceLine(risk)}</div>
    </li>
  );
}
