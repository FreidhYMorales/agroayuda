// web/src/features/map/SheetHandle.tsx
import { type CSSProperties, useRef } from "react";
import { useLang } from "../../lib/urlState";
import { COLORS } from "../../ui/colors";
import { mapCopy } from "./copy";

// The bar on top of the phone sheet. Dragging it moves the sheet freely (MapScreen
// turns the finger travel into a height); a tap, a keyboard or a screen reader use
// it as a plain button that switches between half and most of the screen.
// .ag-map-handle hides it in the side layout, where the panel is already full height.

/** Finger travel, in px, that counts as a drag instead of a tap. */
export const DRAG_MIN_PX = 8;

export interface SheetHandleProps {
  expanded: boolean;
  /** id of the sheet it resizes (aria-controls). */
  controls: string;
  onChange: (expanded: boolean) => void;
  /** A drag began: MapScreen keeps the sheet height it starts from. */
  onDragStart: () => void;
  /** Finger travel since the drag began, in px: negative is up. */
  onDrag: (dy: number) => void;
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

export function SheetHandle({
  expanded,
  controls,
  onChange,
  onDragStart,
  onDrag,
}: SheetHandleProps) {
  const copy = mapCopy(useLang());
  const startY = useRef<number | null>(null);
  // A drag already changed the size; the click the browser fires after it must not undo it.
  const dragged = useRef(false);

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
        dragged.current = false;
        // Keep getting the moves when the finger leaves the bar (jsdom has no capture).
        event.currentTarget.setPointerCapture?.(event.pointerId);
      }}
      onPointerMove={(event) => {
        if (startY.current === null) return;
        const dy = event.clientY - startY.current;
        if (!dragged.current) {
          if (Math.abs(dy) < DRAG_MIN_PX) return;
          dragged.current = true;
          onDragStart();
        }
        onDrag(dy);
      }}
      onPointerUp={() => {
        startY.current = null;
      }}
      onPointerCancel={() => {
        startY.current = null;
      }}
      onClick={() => {
        if (dragged.current) {
          dragged.current = false;
          return;
        }
        onChange(!expanded);
      }}
    >
      <span style={barStyle} />
    </button>
  );
}
