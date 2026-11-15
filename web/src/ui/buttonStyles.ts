// web/src/ui/buttonStyles.ts
import type { CSSProperties } from "react";

// Shared button looks, so the main action on each screen stands out and every
// button keeps a 44 px touch target (docs/architecture.md, UI rules).
//   primary   - the one main action of a screen ("Ver recomendaciones →")
//   secondary - other actions and list items
//   link      - small "›" actions that open more detail
export const BUTTON_VARIANTS = ["primary", "secondary", "link"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const GREEN = "#2e7d32"; // White text on it: 5.1:1 (WCAG AA).
const DARK_GREEN = "#1b5e20"; // On white: 7.9:1.

const base: CSSProperties = {
  minHeight: 44,
  minWidth: 44,
  padding: "0 16px",
  borderRadius: 10,
  font: "inherit",
  fontSize: 16,
  cursor: "pointer",
};

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: GREEN,
    color: "#ffffff",
    border: `2px solid ${GREEN}`,
    fontWeight: 600,
  },
  secondary: {
    backgroundColor: "#ffffff",
    color: DARK_GREEN,
    border: `2px solid ${GREEN}`,
    fontWeight: 600,
  },
  link: {
    backgroundColor: "transparent",
    color: DARK_GREEN,
    border: "none",
    padding: "0 4px",
    textDecoration: "underline",
    textAlign: "left",
  },
};

export function buttonStyle(
  variant: ButtonVariant,
  options: { fullWidth?: boolean } = {},
): CSSProperties {
  return {
    ...base,
    ...variants[variant],
    ...(options.fullWidth === true ? { width: "100%" } : {}),
  };
}
