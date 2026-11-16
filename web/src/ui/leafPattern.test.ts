import { describe, expect, test } from "vitest";
import { THEME_CSS } from "../features/comparison/theme";
import { COLORS } from "./colors";
import { LAYOUT_CSS } from "./layout";
import { LEAF_INK, LEAF_OPACITY, LEAF_PATTERN } from "./leafPattern";

// WCAG relative luminance and contrast ratio for #rrggbb colors.
function channels(hex: string): number[] {
  return [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
}
function luminance(hex: string): number {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
/** The darkest pixel of the pattern: the leaf ink laid over the page color. */
function darkestPatternPixel(): string {
  const ink = channels(LEAF_INK);
  const page = channels(COLORS.background);
  const mixed = page.map((c, i) => Math.round(c + (ink[i] - c) * LEAF_OPACITY));
  return `#${mixed.map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

describe("leaf pattern on the warm background", () => {
  test("is an inline SVG, so it needs no network", () => {
    expect(LEAF_PATTERN).toMatch(/^url\("data:image\/svg\+xml,/);
  });

  test("is faint: the leaf ink stays at or below 8 % opacity", () => {
    expect(LEAF_OPACITY).toBeLessThanOrEqual(0.08);
    expect(decodeURIComponent(LEAF_PATTERN)).toContain(`stroke-opacity='${LEAF_OPACITY}'`);
  });

  test.each([
    ["body text", COLORS.text],
    ["step label", "#4a5656"],
    ["muted text", "#5a5a4a"],
  ])("%s keeps 4.5:1 even on the darkest pixel of the pattern", (_name, color) => {
    expect(contrast(color, darkestPatternPixel())).toBeGreaterThanOrEqual(4.5);
  });

  test("text screens, the page body and the map sheet all show it", () => {
    expect(THEME_CSS).toContain(LEAF_PATTERN);
    expect(LAYOUT_CSS).toMatch(new RegExp(`body\\{[^}]*${escapeRegExp(LEAF_PATTERN)}`));
    expect(LAYOUT_CSS).toMatch(new RegExp(`\\.ag-map-sheet\\{[^}]*${escapeRegExp(LEAF_PATTERN)}`));
  });
});

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
