// web/src/features/risks/RiskRow.tsx
import type { CSSProperties } from "react";
import type { SiteRisk } from "../../contracts/contracts";
import { riskPeriod, riskSourceLine } from "./riskLines";
import { riskTitle } from "./riskTitle";

// A circle drawn with CSS plus a glyph every phone font has. "◐" was missing
// from common fonts and showed as "◖". Text colors meet WCAG AA on each fill.
const LEVEL_BADGE: Record<SiteRisk["level"], { glyph: string; background: string; color: string }> =
  {
    high: { glyph: "⚠", background: "#c62828", color: "#ffffff" },
    medium: { glyph: "!", background: "#f9a825", color: "#1a1a1a" },
    low: { glyph: "✓", background: "#2e7d32", color: "#ffffff" },
    unknown: { glyph: "?", background: "#616161", color: "#ffffff" },
  };

const badgeBaseStyle: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: 24,
  height: 24,
  marginRight: 8,
  borderRadius: "50%",
  fontSize: 14,
  fontWeight: 700,
  lineHeight: 1,
  verticalAlign: "middle",
  flex: "none",
};

// The missing data title already has its own ❔: no badge is repeated.
function showsBadge(risk: SiteRisk): boolean {
  return !riskTitle(risk).startsWith("❔");
}

function LevelBadge({ level }: { level: SiteRisk["level"] }) {
  const badge = LEVEL_BADGE[level];
  return (
    <span
      aria-hidden="true"
      data-testid="level-badge"
      data-level={level}
      style={{ ...badgeBaseStyle, backgroundColor: badge.background, color: badge.color }}
    >
      {badge.glyph}
    </span>
  );
}

const rowStyle: CSSProperties = {
  padding: "12px 0",
  borderBottom: "1px solid #d0d0d0",
  listStyle: "none",
};
const titleStyle: CSSProperties = { fontWeight: 600 };
const detailStyle: CSSProperties = { fontSize: "0.875rem", marginTop: 2 };

export function RiskRow({ risk }: { risk: SiteRisk }) {
  const period = riskPeriod(risk);

  return (
    <li style={rowStyle}>
      <div style={titleStyle}>
        {showsBadge(risk) && <LevelBadge level={risk.level} />}
        {riskTitle(risk)}
      </div>
      {period !== "" && <div style={detailStyle}>{period}</div>}
      <div style={detailStyle}>{riskSourceLine(risk)}</div>
    </li>
  );
}
