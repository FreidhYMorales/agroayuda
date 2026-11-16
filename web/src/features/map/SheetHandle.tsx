// web/src/features/map/SheetHandle.tsx
import { type CSSProperties, useRef } from "react";
import { useLang } from "../../lib/urlState";
import { COLORS } from "../../ui/colors";
import { mapCopy } from "./copy";

// The bar on top of the phone sheet. Two sizes only (half and most of the
// screen): a tap or a swipe switches between them, and a keyboard or screen
// reader uses it as a plain button. .ag-map-handle hides it in the side layout,
// where the panel is already full height.

/** Finger travel, in px, that counts as a swipe instead of a tap. */
export const SWIPE_MIN_PX = 30;

export interface SheetHandleProps {
  expanded: boolean;
  /** id of the sheet it resizes (aria-controls). */
  controls: string;
  onChange: (expanded: boolean) => void;
}

// Touch target of at least 44 px around the 40 x 4 px bar. touch-action:none
// keeps the page from scrolling while the finger swipes on it. display lives in
// .ag-map-handle (src/ui/layout.ts): an inline value would beat its display:none.
const handleStyle: CSSProperties = {
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "stretch",
  flex: "none",
  minHeight: 44,
  margin: "-8px -12px 0",
  padding: 0,
  border: "none",
  background: COLORS.background,
  cursor: "pointer",
  touchAction: "none",
};
const barStyle: CSSProperties = {
  width: 40,
  height: 4,
  borderRadius: 2,
  background: COLORS.border,
};

export function SheetHandle({ expanded, controls, onChange }: SheetHandleProps) {
  const copy = mapCopy(useLang());
  const startY = useRef<number | null>(null);
  // A swipe already changed the size; the click the browser fires after it must not undo it.
  const swiped = useRef(false);

  return (
    <button
      type="button"
      className="ag-map-handle"
      style={handleStyle}
      aria-label={expanded ? copy.sheetCollapse : copy.sheetExpand}
      aria-expanded={expanded}
      aria-controls={controls}
      onPointerDown={(event) => {
        startY.current = event.clientY;
        swiped.current = false;
      }}
      onPointerUp={(event) => {
        if (startY.current === null) return;
        const dy = event.clientY - startY.current;
        startY.current = null;
        if (Math.abs(dy) < SWIPE_MIN_PX) return;
        swiped.current = true;
        onChange(dy < 0);
      }}
      onClick={() => {
        if (swiped.current) {
          swiped.current = false;
          return;
        }
        onChange(!expanded);
      }}
    >
      <span style={barStyle} />
    </button>
  );
}
