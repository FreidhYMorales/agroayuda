// web/src/ui/colors.test.ts
import { expect, test } from "vitest";
import { THEME_CSS } from "../features/comparison/theme";
import { COLORS } from "./colors";

// The theme may write a color in short form (#fff for #ffffff).
function shortHex(value: string): string {
  return value.replace(/^#(.)\1(.)\2(.)\3$/, "#$1$2$3");
}

// The map and risks screens must look like the form and comparison
// (package 04): same background, card, text, green and border.
test.each(Object.entries(COLORS))(
  "%s (%s) is a color of the form and comparison theme",
  (_name, value) => {
    const css = THEME_CSS.toLowerCase();
    const full = value.toLowerCase();
    const short = shortHex(full);
    const found = css.includes(full) || new RegExp(`${short}(?![0-9a-f])`).test(css);
    expect(found).toBe(true);
  },
);
