// web/src/ui/buttonStyles.ts
import type { CSSProperties } from "react";
import { COLORS } from "./colors";

// Shared button looks, matching the form and comparison buttons (.ag-btn in
// features/comparison/theme.tsx), with 48 px touch targets.
//   primary   - the one main action of a screen ("Ver recomendaciones →")
//   secondary - other actions and list items
//   link      - small "›" actions that open more detail
export const BUTTON_VARIANTS = ["primary", "secondary", "link"] as const;
export type ButtonVariant = (typeof BUTTON_VARIANTS)[number];

const base: CSSProperties = {
  minHeight: 48,
  minWidth: 48,
  padding: "0 16px",
  borderRadius: 12,
  font: "inherit",
  fontSize: 16,
  cursor: "pointer",
};

const variants: Record<ButtonVariant, CSSProperties> = {
  primary: {
    backgroundColor: COLORS.primary,
    color: "#ffffff",
    border: `2px solid ${COLORS.primary}`,
    fontWeight: 700,
  },
  secondary: {
    backgroundColor: COLORS.card,
    color: COLORS.text,
    border: `2px solid ${COLORS.border}`,
    fontWeight: 600,
  },
  link: {
    backgroundColor: "transparent",
    color: COLORS.primary,
    border: "none",
    padding: "0 4px",
    fontWeight: 600,
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
