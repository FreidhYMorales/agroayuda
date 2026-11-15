// web/src/ui/buttonStyles.test.ts
import { describe, expect, test } from "vitest";
import { BUTTON_VARIANTS, buttonStyle } from "./buttonStyles";
import { COLORS } from "./colors";

// WCAG relative luminance and contrast ratio for #rrggbb colors.
function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe("buttonStyle", () => {
  test.each(BUTTON_VARIANTS)("%s keeps a touch target of at least 44 px", (variant) => {
    const style = buttonStyle(variant);

    expect(style.minHeight).toBeGreaterThanOrEqual(44);
    expect(style.minWidth).toBeGreaterThanOrEqual(44);
  });

  test.each(BUTTON_VARIANTS)("%s text meets WCAG AA contrast on its background", (variant) => {
    const style = buttonStyle(variant);
    // The link variant is transparent and sits on white cards and sheets.
    const background =
      style.backgroundColor === "transparent" ? "#ffffff" : String(style.backgroundColor);

    expect(contrast(String(style.color), background)).toBeGreaterThanOrEqual(4.5);
  });

  test("primary and secondary look different, so the main action stands out", () => {
    expect(buttonStyle("primary").backgroundColor).not.toBe(
      buttonStyle("secondary").backgroundColor,
    );
  });

  test("a full-width button stretches and keeps its variant", () => {
    const style = buttonStyle("secondary", { fullWidth: true });

    expect(style.width).toBe("100%");
    expect(style.backgroundColor).toBe(buttonStyle("secondary").backgroundColor);
  });
});

describe("buttonStyle matches the form and comparison buttons", () => {
  test("primary uses the theme green", () => {
    expect(buttonStyle("primary").backgroundColor).toBe(COLORS.primary);
  });

  test("secondary is white with the theme border and text", () => {
    const style = buttonStyle("secondary");
    expect(style.backgroundColor).toBe(COLORS.card);
    expect(style.color).toBe(COLORS.text);
    expect(String(style.border)).toContain(COLORS.border);
  });

  test("targets are 48 px, like the form buttons", () => {
    for (const variant of BUTTON_VARIANTS) {
      expect(buttonStyle(variant).minHeight).toBe(48);
    }
  });
});
