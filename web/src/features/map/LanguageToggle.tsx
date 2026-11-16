// web/src/features/map/LanguageToggle.tsx
import type { CSSProperties } from "react";
import { type Lang, useAppState, useLang } from "../../lib/urlState";
import { COLORS } from "../../ui/colors";

// A two-sided slider: a green thumb slides to the current language.
// It is a radio group, not an on/off switch: a language is picked, never
// "turned on", so screen readers announce "Español, 1 of 2, selected".
// Native radios give arrow-key moves for free.

// Language names are written in their own language, so each reader finds theirs.
const LANGUAGES: { lang: Lang; short: string; name: string }[] = [
  { lang: "es", short: "ES", name: "Español" },
  { lang: "en", short: "EN", name: "English" },
];

// Inline styles cannot hold :focus-visible or media queries.
export const LANGUAGE_TOGGLE_CSS = `
.ag-lang input:focus-visible+span{outline:3px solid ${COLORS.primary};outline-offset:4px;border-radius:6px}
@media (prefers-reduced-motion:reduce){.ag-lang-thumb{transition:none}}
`;

const trackStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  flex: "none",
  border: `2px solid ${COLORS.border}`,
  borderRadius: 12,
  backgroundColor: COLORS.card,
};
const thumbBase: CSSProperties = {
  position: "absolute",
  top: 2,
  bottom: 2,
  left: 2,
  width: "calc(50% - 2px)",
  borderRadius: 9,
  backgroundColor: COLORS.primary,
  transition: "transform 0.2s ease",
};
// Touch target of at least 44 px per side (48 px with the track border).
const sideStyle: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 44,
  minWidth: 48,
  padding: "0 8px",
  fontSize: 16,
  fontWeight: 700,
  cursor: "pointer",
};
// Hidden but still focusable and announced; the visible part is the text.
const inputStyle: CSSProperties = {
  position: "absolute",
  opacity: 0,
  width: 1,
  height: 1,
  margin: 0,
};

export function LanguageToggle() {
  const lang = useLang();
  const [, setState] = useAppState();

  return (
    <div
      role="radiogroup"
      aria-label="Idioma / Language"
      className="ag-lang"
      data-lang={lang}
      style={trackStyle}
    >
      <style>{LANGUAGE_TOGGLE_CSS}</style>
      <span
        className="ag-lang-thumb"
        aria-hidden="true"
        style={{ ...thumbBase, transform: lang === "en" ? "translateX(100%)" : "none" }}
      />
      {LANGUAGES.map((option) => {
        const active = option.lang === lang;
        return (
          <label key={option.lang} style={sideStyle}>
            <input
              type="radio"
              name="ag-lang"
              aria-label={option.name}
              checked={active}
              // English is the default, so it is kept out of the URL.
              onChange={() => setState({ lang: option.lang === "es" ? "es" : undefined })}
              style={inputStyle}
            />
            <span style={{ color: active ? "#ffffff" : COLORS.text }}>{option.short}</span>
          </label>
        );
      })}
    </div>
  );
}
