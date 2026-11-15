// web/src/features/map/RainLegend.tsx
import type { CSSProperties } from "react";
import { MAP_COPY } from "./copy";
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
  return (
    <div style={legendStyle}>
      {/* The words carry the meaning, so the color bar is hidden from assistive tech. */}
      <div data-testid="rain-legend-bar" aria-hidden="true" style={barStyle} />
      <div style={labelsStyle}>
        <span>{MAP_COPY.rainLow}</span>
        <span>{MAP_COPY.rainHigh}</span>
      </div>
    </div>
  );
}
