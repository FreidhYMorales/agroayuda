// web/src/features/map/LocateButton.tsx
import type { CSSProperties } from "react";
import { MAP_COPY } from "./copy";

export interface LocateButtonProps {
  locating: boolean;
  onLocate: () => void;
}

// Touch target of at least 44 px.
const buttonStyle: CSSProperties = { minHeight: 44, minWidth: 44, padding: "0 16px" };

export function LocateButton({ locating, onLocate }: LocateButtonProps) {
  return (
    // Disabled while locating so a second tap cannot start a second request.
    <button
      type="button"
      style={buttonStyle}
      disabled={locating}
      aria-busy={locating}
      onClick={onLocate}
    >
      {MAP_COPY.locate}
    </button>
  );
}
