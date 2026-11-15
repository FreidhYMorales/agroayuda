// web/src/features/map/SummaryCard.tsx
import type { CSSProperties } from "react";
import type { SiteProfile } from "../../contracts/contracts";
import { riskTitle, sortRisks } from "../risks/riskTitle";
import { buttonStyle } from "../../ui/buttonStyles";
import { MAP_COPY } from "./copy";

export interface SummaryCardProps {
  site: SiteProfile;
  placeName?: string | undefined; // nombre del lugar de demo; si no hay, "Su zona"
  onViewRisks: () => void;
  onViewRecommendations: () => void;
  onPickPlace: () => void;
}

// Áreas táctiles >= 44 px.

const cardStyle: CSSProperties = {
  padding: 16,
  borderRadius: 12,
  background: "#ffffff",
  color: "#1a1a1a",
  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)",
};
const actionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 };

export function SummaryCard({
  site,
  placeName,
  onViewRisks,
  onViewRecommendations,
  onPickPlace,
}: SummaryCardProps) {
  const topRisk = sortRisks(site.risks)[0];
  const showTopRisk = topRisk !== undefined && topRisk.level === "high";

  return (
    <section style={cardStyle}>
      <h2>{placeName ?? MAP_COPY.defaultTitle}</h2>
      <p>{MAP_COPY.zoneLine(site.cell_resolution_km)}</p>
      {showTopRisk && <p>{`⚠ ${riskTitle(topRisk)}`}</p>}
      <div style={actionsStyle}>
        <button type="button" style={buttonStyle("secondary")} onClick={onViewRisks}>
          {MAP_COPY.viewRisks}
        </button>
        <button type="button" style={buttonStyle("primary")} onClick={onViewRecommendations}>
          {MAP_COPY.viewRecommendations}
        </button>
      </div>
      <button type="button" style={{ ...buttonStyle("link"), marginTop: 8 }} onClick={onPickPlace}>
        {MAP_COPY.pickPlace}
      </button>
    </section>
  );
}
