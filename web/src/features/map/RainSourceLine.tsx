// web/src/features/map/RainSourceLine.tsx
import { type CSSProperties, useState } from "react";
import type { RainCellProperties } from "../../contracts/contracts";
import { MAP_COPY } from "./copy";
import { rainSourceDetail } from "./rainLayer";

export interface RainSourceLineProps {
  properties: RainCellProperties;
}

// Touch target of at least 44 px.
const buttonStyle: CSSProperties = { minHeight: 44, minWidth: 44, padding: "0 16px" };

export function RainSourceLine({ properties }: RainSourceLineProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        style={buttonStyle}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {MAP_COPY.sourceLine}
      </button>
      {/* Text only: no NASA logo, as the work package requires. */}
      {open && <p>{rainSourceDetail(properties)}</p>}
    </div>
  );
}
