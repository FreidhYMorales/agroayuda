// web/src/features/map/RainSourceLine.tsx
import { useState } from "react";
import type { RainCellProperties } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";
import { MAP_COPY } from "./copy";
import { rainSourceDetail } from "./rainLayer";

export interface RainSourceLineProps {
  properties: RainCellProperties;
}

// Touch target of at least 44 px.
const sourceStyle = buttonStyle("link");

export function RainSourceLine({ properties }: RainSourceLineProps) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        style={sourceStyle}
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
