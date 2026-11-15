// web/src/features/map/RainLegend.tsx
import type { CSSProperties } from "react";
import { mapCopy } from "./copy";
import { useLang } from "../../lib/urlState";
import { rainLegendGradient } from "./rainLayer";

const legendStyle: CSSProperties = { padding: "4px 8px" };
const barStyle: CSSProperties = {
  height: 12,
  borderRadius: 6,
  background: rainLegendGradient(),
};
const labelsStyle: CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  fontSize: "0.875rem",
  marginTop: 4,
};

export function RainLegend() {
  const copy = mapCopy(useLang());
  return (
    <div style={legendStyle}>
      {/* The words carry the meaning, so the color bar is hidden from assistive tech. */}
      <div data-testid="rain-legend-bar" aria-hidden="true" style={barStyle} />
      <div style={labelsStyle}>
        <span>{copy.rainLow}</span>
        <span>{copy.rainHigh}</span>
      </div>
    </div>
  );
}
