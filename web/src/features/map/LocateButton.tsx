// web/src/features/map/LocateButton.tsx
import { buttonStyle } from "../../ui/buttonStyles";
import { MAP_COPY } from "./copy";

export interface LocateButtonProps {
  locating: boolean;
  onLocate: () => void;
}

// Touch target of at least 44 px.
const locateStyle = buttonStyle("secondary", { fullWidth: true });

export function LocateButton({ locating, onLocate }: LocateButtonProps) {
  return (
    // Disabled while locating so a second tap cannot start a second request.
    <button
      type="button"
      style={locateStyle}
      disabled={locating}
      aria-busy={locating}
      onClick={onLocate}
    >
      {MAP_COPY.locate}
    </button>
  );
}
