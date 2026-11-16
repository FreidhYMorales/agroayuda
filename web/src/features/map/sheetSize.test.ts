import { describe, expect, test } from "vitest";
import { MAP_SHEET } from "../../ui/layout";
import { clampSheetHeight } from "./sheetSize";

// available = screen height minus the header, in px.
describe("free sheet height", () => {
  test("follows the finger between the limits", () => {
    expect(clampSheetHeight(300, 600)).toBe(300);
  });

  test("never goes below the handle plus one line", () => {
    expect(clampSheetHeight(10, 600)).toBe(MAP_SHEET.minHeight);
  });

  test("always leaves a strip of map visible", () => {
    expect(clampSheetHeight(590, 600)).toBe(600 - MAP_SHEET.mapMinHeight);
  });

  test("on a tiny screen the sheet minimum wins over the map strip", () => {
    expect(clampSheetHeight(200, 150)).toBe(MAP_SHEET.minHeight);
  });

  test("rounds to whole pixels", () => {
    expect(clampSheetHeight(250.6, 600)).toBe(251);
  });
});
