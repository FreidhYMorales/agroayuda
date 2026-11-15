// web/src/features/map/SummaryCard.tsx
import type { CSSProperties } from "react";
import type { SiteProfile } from "../../contracts/contracts";
import { riskTitle, sortRisks } from "../risks/riskTitle";
import { buttonStyle } from "../../ui/buttonStyles";
import { mapCopy } from "./copy";
import { useLang } from "../../lib/urlState";

export interface SummaryCardProps {
  site: SiteProfile;
  placeName?: string | undefined; // demo place name; "Su zona" when there is none
  onViewRisks: () => void;
  onViewRecommendations: () => void;
  onPickPlace: () => void;
}

// No frame of its own: the card lives in the map bottom sheet, which already
// has the background, rounded corners and shadow.
const cardStyle: CSSProperties = { color: "#1a1a1a" };
const titleStyle: CSSProperties = { marginTop: 0, marginBottom: 8 };
const actionsStyle: CSSProperties = { display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 };

export function SummaryCard({
  site,
  placeName,
  onViewRisks,
  onViewRecommendations,
  onPickPlace,
}: SummaryCardProps) {
  const copy = mapCopy(useLang());
  const topRisk = sortRisks(site.risks)[0];
  const showTopRisk = topRisk !== undefined && topRisk.level === "high";

  return (
    <section style={cardStyle}>
      <h2 style={titleStyle}>{placeName ?? copy.defaultTitle}</h2>
      <p>{copy.zoneLine(site.cell_resolution_km)}</p>
      {showTopRisk && <p>{`⚠ ${riskTitle(topRisk)}`}</p>}
      <div style={actionsStyle}>
        <button type="button" style={buttonStyle("secondary")} onClick={onViewRisks}>
          {copy.viewRisks}
        </button>
        <button type="button" style={buttonStyle("primary")} onClick={onViewRecommendations}>
          {copy.viewRecommendations}
        </button>
      </div>
      <button type="button" style={{ ...buttonStyle("link"), marginTop: 8 }} onClick={onPickPlace}>
        {copy.pickPlace}
      </button>
    </section>
  );
}
