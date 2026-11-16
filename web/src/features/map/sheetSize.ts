import { MAP_SHEET } from "../../ui/layout";

/**
 * Height of the dragged phone sheet, in whole px: at least the handle plus one line,
 * and at most what leaves MAP_SHEET.mapMinHeight of map visible.
 * `available` is the screen height minus the header.
 */
export function clampSheetHeight(height: number, available: number): number {
  const max = Math.max(MAP_SHEET.minHeight, available - MAP_SHEET.mapMinHeight);
  return Math.round(Math.min(Math.max(height, MAP_SHEET.minHeight), max));
}
