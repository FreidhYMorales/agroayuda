// web/src/features/form/PriorityInfo.tsx
import { type CSSProperties, useId, useRef, useState } from "react";
import { useLang } from "../../lib/urlState";
import { COLORS } from "../../ui/colors";
import { formCopy } from "./copy";

// The ⓘ next to "¿Qué es lo más importante para usted?". A tap (not a hover:
// phones have none) opens a small floating card that says what each priority
// scores. A second tap, "Cerrar" or Escape closes it.

const wrapStyle: CSSProperties = { position: "relative", flex: "none" };
// Touch target of at least 44 px around the 22 px symbol.
const buttonStyle: CSSProperties = {
  minWidth: 44,
  minHeight: 44,
  padding: 0,
  border: "none",
  background: "transparent",
  color: COLORS.primary,
  fontSize: 22,
  lineHeight: 1,
  cursor: "pointer",
};
// Floats under the ⓘ, anchored to the right so it never leaves a 320 px screen.
const cardStyle: CSSProperties = {
  position: "absolute",
  top: "100%",
  right: 0,
  zIndex: 10,
  width: "min(300px, calc(100vw - 48px))",
  padding: "12px 14px",
  borderRadius: 12,
  border: `2px solid ${COLORS.border}`,
  background: COLORS.card,
  color: COLORS.text,
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
  fontSize: 15,
  fontWeight: 400,
};

export function PriorityInfo() {
  const copy = formCopy(useLang()).info;
  const [open, setOpen] = useState(false);
  const cardId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = () => {
    setOpen(false);
    buttonRef.current?.focus();
  };

  return (
    <div style={wrapStyle}>
      <button
        ref={buttonRef}
        type="button"
        style={buttonStyle}
        aria-label={copy.open}
        aria-expanded={open}
        aria-controls={open ? cardId : undefined}
        onClick={() => setOpen((value) => !value)}
      >
        ⓘ
      </button>
      {open ? (
        <section
          id={cardId}
          aria-label={copy.open}
          style={cardStyle}
          onKeyDown={(event) => {
            if (event.key === "Escape") close();
          }}
        >
          <ul style={{ margin: "0 0 8px", paddingLeft: 0, listStyle: "none" }}>
            {copy.lines.map((line) => (
              <li key={line} style={{ marginBottom: 6 }}>
                {line}
              </li>
            ))}
          </ul>
          <p style={{ margin: "0 0 8px" }}>{copy.howUsed}</p>
          <button type="button" className="ag-btn ag-link" onClick={close}>
            {copy.close}
          </button>
        </section>
      ) : null}
    </div>
  );
}
