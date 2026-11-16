// web/src/ui/layout.ts
import { COLORS } from "./colors";

// Responsive layout for every screen (work package 09). Three views:
//   phone   - one column, the layout the app was built for (360 px reference);
//   tablet  - map with a side panel, text screens up to 880 px with two columns;
//   desktop - same structure with a wider panel and more air.
// Plain CSS media queries only: inline styles cannot hold them, so screens use
// these class names and App renders LAYOUT_CSS once.

export const BREAKPOINTS = {
  /** Tablet view from here; also map and sheet side by side. */
  tablet: 768,
  /** Desktop view from here. */
  desktop: 1200,
  /** Phones in landscape: short screens get the map side layout too. */
  shortHeight: 500,
} as const;

/** Max width of text screens (risks, form, comparison, detail) per view. */
export const CONTENT_MAX_WIDTH = { phone: 560, tablet: 880, desktop: 1040 } as const;
/** Width of the map's side panel when it sits next to the map. */
export const SHEET_SIDE_WIDTH = { tablet: 380, desktop: 420 } as const;

/** Every media query, built from BREAKPOINTS so no number is typed twice. */
export const MEDIA = {
  /** Map and panel side by side: tablets and desktops, and phones held in landscape. */
  mapSide: `(min-width: ${BREAKPOINTS.tablet}px), (orientation: landscape) and (max-height: ${BREAKPOINTS.shortHeight}px)`,
  /** Tablet view of the text screens (a landscape phone keeps the phone view: too short). */
  tablet: `(min-width: ${BREAKPOINTS.tablet}px)`,
  /** Desktop view of every screen. */
  desktop: `(min-width: ${BREAKPOINTS.desktop}px)`,
} as const;

// Shadow towards the map when the panel sits on its right; clipped so it only
// falls on the map side and the header and sheet read as one panel.
const SIDE_SHADOW = "box-shadow:-2px 0 8px rgba(0,0,0,.15);clip-path:inset(0 0 0 -12px)";

/** Global layout CSS, rendered once by App in a <style> tag. */
export const LAYOUT_CSS = `
*,*::before,*::after{box-sizing:border-box}
img,svg,canvas{max-width:100%}
.ag-screen{max-width:${CONTENT_MAX_WIDTH.phone}px;margin:0 auto;padding-inline:16px;
padding-bottom:max(16px,env(safe-area-inset-bottom))}
.ag-map-screen{display:flex;flex-direction:column;height:100dvh}
.ag-map-header{flex:none}
.ag-map-area{position:relative;flex:1 1 auto;min-height:200px}
.ag-map-sheet{flex:0 1 auto;max-height:50dvh;overflow-y:auto;display:flex;flex-direction:column;
gap:12px;padding:8px 12px 16px;padding-bottom:max(16px,env(safe-area-inset-bottom));
border-radius:16px 16px 0 0;background-color:${COLORS.background};box-shadow:0 -2px 8px rgba(0,0,0,.15)}
/* Phone: the handle (SheetHandle) switches the sheet between half and most of the screen,
   and stays on top while the sheet content scrolls. */
.ag-map-sheet[data-expanded="true"]{max-height:85dvh}
.ag-map-handle{display:flex;position:sticky;top:-8px;z-index:1}
/* Comparison table: long English words wrap; the wrapper only catches what still does not fit. */
.ag-table th,.ag-table td,.ag-note{overflow-wrap:anywhere;hyphens:auto}
.ag-table-wrap{overflow-x:auto}
@media ${MEDIA.mapSide}{
.ag-map-screen{display:grid;grid-template-columns:minmax(0,1fr) min(${SHEET_SIDE_WIDTH.tablet}px,50%);
grid-template-rows:auto minmax(0,1fr)}
.ag-map-header{grid-column:2;grid-row:1;${SIDE_SHADOW}}
.ag-map-area{grid-column:1;grid-row:1 / span 2;min-width:0;min-height:0}
.ag-map-sheet,.ag-map-sheet[data-expanded="true"]{grid-column:2;grid-row:2;max-height:none;height:100%;border-radius:0;${SIDE_SHADOW}}
.ag-map-handle{display:none}
}
@media ${MEDIA.tablet}{
.ag-screen{max-width:${CONTENT_MAX_WIDTH.tablet}px;padding-inline:24px}
.ag-cols{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;align-items:start}
.ag-cols>.ag-span{grid-column:1 / -1}
.ag-risk-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.ag-notes{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}
.ag-screen .ag-table{max-width:720px;font-size:16px;margin-inline:auto}
.ag-screen .ag-crop-grid{grid-template-columns:repeat(3,minmax(0,1fr))}
.ag-screen .ag-primary,.ag-screen .ag-action{display:block;max-width:420px;margin-inline:auto}
}
@media ${MEDIA.desktop}{
.ag-screen{max-width:${CONTENT_MAX_WIDTH.desktop}px;padding-inline:32px}
.ag-cols{gap:32px}
.ag-screen .ag-table{max-width:800px}
.ag-screen .ag-crop-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.ag-map-screen{grid-template-columns:minmax(0,1fr) min(${SHEET_SIDE_WIDTH.desktop}px,50%)}
}
`;
