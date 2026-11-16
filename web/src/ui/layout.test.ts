// web/src/ui/layout.test.ts
import { describe, expect, test } from "vitest";
import { THEME_CSS } from "../features/comparison/theme";
import { BREAKPOINTS, CONTENT_MAX_WIDTH, LAYOUT_CSS, MEDIA, SHEET_SIDE_WIDTH } from "./layout";

// jsdom does not lay out pages, so these tests read the CSS rules themselves.

/** Body of the first `@media <query>{...}` block, or undefined when missing. */
function mediaBody(css: string, query: string): string | undefined {
  const start = css.indexOf(`@media ${query}{`);
  if (start === -1) return undefined;
  let depth = 0;
  for (let i = css.indexOf("{", start); i < css.length; i++) {
    if (css[i] === "{") depth++;
    if (css[i] === "}") depth--;
    if (depth === 0) return css.slice(css.indexOf("{", start) + 1, i);
  }
  return undefined;
}

/** The CSS outside every @media block (the phone view). */
function outsideMedia(css: string): string {
  let result = "";
  let depth = 0;
  let inMedia = false;
  for (let i = 0; i < css.length; i++) {
    if (!inMedia && css.startsWith("@media", i)) inMedia = true;
    if (inMedia) {
      if (css[i] === "{") depth++;
      if (css[i] === "}") {
        depth--;
        if (depth === 0) inMedia = false;
      }
      continue;
    }
    result += css[i];
  }
  return result;
}

/** Declarations of the first rule for `selector` in a CSS fragment. */
function rule(css: string, selector: string): string | undefined {
  const match = new RegExp(
    `(?:^|[}\\s])${selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\{([^}]*)\\}`,
  ).exec(css);
  return match?.[1];
}

describe("media queries are built from BREAKPOINTS", () => {
  test("map side layout: wide screens or short landscape screens", () => {
    expect(MEDIA.mapSide).toBe(
      `(min-width: ${BREAKPOINTS.tablet}px), (orientation: landscape) and (max-height: ${BREAKPOINTS.shortHeight}px)`,
    );
    expect(mediaBody(LAYOUT_CSS, MEDIA.mapSide)).toBeDefined();
  });

  test("tablet and desktop views", () => {
    expect(MEDIA.tablet).toBe(`(min-width: ${BREAKPOINTS.tablet}px)`);
    expect(MEDIA.desktop).toBe(`(min-width: ${BREAKPOINTS.desktop}px)`);
    expect(mediaBody(LAYOUT_CSS, MEDIA.tablet)).toBeDefined();
    expect(mediaBody(LAYOUT_CSS, MEDIA.desktop)).toBeDefined();
  });
});

describe("text screens", () => {
  test(".ag-screen max width per view equals CONTENT_MAX_WIDTH", () => {
    expect(rule(outsideMedia(LAYOUT_CSS), ".ag-screen")).toContain(
      `max-width:${CONTENT_MAX_WIDTH.phone}px`,
    );
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.tablet) ?? "", ".ag-screen")).toContain(
      `max-width:${CONTENT_MAX_WIDTH.tablet}px`,
    );
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.desktop) ?? "", ".ag-screen")).toContain(
      `max-width:${CONTENT_MAX_WIDTH.desktop}px`,
    );
  });

  test(".ag-cols is one column on phones and two from the tablet view", () => {
    expect(outsideMedia(LAYOUT_CSS)).not.toMatch(/\.ag-cols\{[^}]*grid-template-columns/);
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.tablet) ?? "", ".ag-cols")).toContain(
      "grid-template-columns:repeat(2,minmax(0,1fr))",
    );
  });

  test("risk rows and notes become grids only from the tablet view", () => {
    const tablet = mediaBody(LAYOUT_CSS, MEDIA.tablet) ?? "";
    expect(rule(tablet, ".ag-risk-grid")).toContain(
      "grid-template-columns:repeat(2,minmax(0,1fr))",
    );
    expect(rule(tablet, ".ag-notes")).toContain("repeat(auto-fit,minmax(220px,1fr))");
    expect(outsideMedia(LAYOUT_CSS)).not.toMatch(/\.ag-risk-grid\{[^}]*display:grid/);
  });
});

describe("map screen", () => {
  test("the side panel is as wide as SHEET_SIDE_WIDTH per view", () => {
    expect(mediaBody(LAYOUT_CSS, MEDIA.mapSide)).toContain(`${SHEET_SIDE_WIDTH.tablet}px`);
    expect(mediaBody(LAYOUT_CSS, MEDIA.desktop)).toContain(`${SHEET_SIDE_WIDTH.desktop}px`);
  });

  test("the phone sheet keeps today's height cap and the handle hides on the side", () => {
    expect(rule(outsideMedia(LAYOUT_CSS), ".ag-map-sheet")).toContain("max-height:50dvh");
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.mapSide) ?? "", ".ag-map-handle")).toContain(
      "display:none",
    );
  });
});

describe("map sheet expand (phone)", () => {
  test("an expanded sheet grows to 85dvh on phones", () => {
    expect(rule(outsideMedia(LAYOUT_CSS), '.ag-map-sheet[data-expanded="true"]')).toContain(
      "max-height:85dvh",
    );
  });

  test("in the side layout the sheet is full height either way", () => {
    expect(
      rule(
        mediaBody(LAYOUT_CSS, MEDIA.mapSide) ?? "",
        '.ag-map-sheet,.ag-map-sheet[data-expanded="true"]',
      ),
    ).toContain("max-height:none");
  });

  test("the handle stays on top while the sheet content scrolls", () => {
    expect(rule(outsideMedia(LAYOUT_CSS), ".ag-map-handle")).toContain("position:sticky");
  });
});

describe("safety rules", () => {
  test("bottom padding respects the phone's safe area", () => {
    expect(LAYOUT_CSS).toContain("env(safe-area-inset-bottom)");
  });

  test("never hides overflow on html or body and never blocks zoom", () => {
    expect(LAYOUT_CSS).not.toMatch(/(html|body)[^{]*\{[^}]*overflow-x:\s*hidden/);
    expect(LAYOUT_CSS).not.toContain("user-scalable");
  });

  test("every box sizes with its border and media never overflows", () => {
    expect(LAYOUT_CSS).toContain("box-sizing:border-box");
    expect(rule(LAYOUT_CSS, "img,svg,canvas")).toContain("max-width:100%");
  });
});

describe("form and comparison theme (THEME_CSS)", () => {
  test("hover rules only apply on devices that hover (no sticky hover after a tap)", () => {
    const hover = mediaBody(THEME_CSS, "(hover:hover)") ?? "";

    expect(outsideMedia(THEME_CSS)).not.toContain(":hover");
    expect(hover).toContain(".ag-btn:hover");
    expect(hover).toContain(".ag-primary:hover");
  });

  test(".ag keeps colors and font but leaves width and side padding to .ag-screen", () => {
    const ag = rule(outsideMedia(THEME_CSS), ".ag") ?? "";

    expect(ag).toContain("background:");
    expect(ag).not.toContain("max-width");
    expect(ag).not.toMatch(/padding:\s*\d/);
  });

  test("crop grids get 3 columns on tablets and 4 on desktops", () => {
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.tablet) ?? "", ".ag-screen .ag-crop-grid")).toContain(
      "repeat(3,minmax(0,1fr))",
    );
    expect(rule(mediaBody(LAYOUT_CSS, MEDIA.desktop) ?? "", ".ag-screen .ag-crop-grid")).toContain(
      "repeat(4,minmax(0,1fr))",
    );
  });
});

describe("comparison table on small phones", () => {
  test("the table wrapper scrolls on its own, as a safety net only", () => {
    expect(rule(LAYOUT_CSS, ".ag-table-wrap")).toContain("overflow-x:auto");
  });

  test("long words in the table and the notes wrap instead of widening the page", () => {
    expect(LAYOUT_CSS).toMatch(
      /\.ag-table th,\.ag-table td,\.ag-note\{[^}]*overflow-wrap:anywhere/,
    );
  });

  test("below 360 px the table is a bit denser so it fits 320 px in Spanish", () => {
    const small = mediaBody(THEME_CSS, "(max-width:359px)") ?? "";

    expect(rule(small, ".ag-table")).toContain("font-size:14px");
    expect(small).toMatch(/\.ag-table th\[scope="row"\]\{[^}]*width:22%/);
  });
});

describe("200% zoom on a phone (about 180 CSS px wide)", () => {
  test("only below 320 px the five 48 px priority circles may wrap to a second line", () => {
    const tiny = mediaBody(THEME_CSS, "(max-width:319px)") ?? "";

    expect(rule(tiny, ".ag-circles")).toContain("flex-wrap:wrap");
    expect(rule(outsideMedia(THEME_CSS), ".ag-circles")).not.toContain("flex-wrap");
  });
});
