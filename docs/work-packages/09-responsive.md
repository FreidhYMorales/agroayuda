# Work package 09: Web — responsive layout: phone, tablet and desktop views

Estimate: 5-6 hours · Depends on: packages 03 (map, risks, App shell) and 04 (form, comparison), both merged in `main` · Do not merge layout changes during a demo recording.

How to work this package with Claude, step by step: `09-responsive-ai-guide.md` (read it first).

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Only create or edit the files listed under "Files to deliver".
> Layout and CSS only: do not change contracts, copy (Spanish or English), behavior, URL state or data flow.
> Do not add dependencies (no CSS framework, no media-query library): plain CSS media queries only.
> Write the failing test first, then the code (Strict TDD). Tests never call the network.
> If a change seems needed outside these files, tell me instead of making it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026). Four screens: map (`MapScreen`), site risks (`RisksScreen`), one form (`FormScreen`) and the comparison with its option detail (`ComparisonScreen`, `OptionDetail`). The UI has two languages (`?lang=en`); English strings are often longer than Spanish ones.

The app was built for a ~360 px portrait phone. Today:

- `web/src/App.tsx` wraps every screen in `<main style={{ maxWidth: 480 }}>`, so on a tablet or desktop the map is a narrow strip in the middle of the screen.
- The map screen is a column: header, map (`flex: 1`), bottom sheet with `maxHeight: 50dvh`. On a phone in landscape (height ~360-430 px) the sheet and header leave almost no map.
- Styles are inline `CSSProperties` objects (map, risks) or one CSS string (`THEME_CSS` in `web/src/features/comparison/theme.tsx`, used by form and comparison). Inline styles cannot hold media queries, so the responsive rules need class names plus a CSS string.
- Widths are inconsistent: `App` 480 px, `RisksScreen` 480 px, `.ag` (form, comparison) 560 px.
- `index.html` has no `viewport-fit=cover`, so content can sit under the iPhone home bar.
- The comparison table is `table-layout: fixed` with ~65 px columns at 360 px; at 320 px (small Android, iPhone SE zoomed) and with long English words it can overflow.
- `:hover` styles apply on touch screens too (sticky hover after a tap).

## Scope

- In: one shared layout module (breakpoints + responsive CSS); three views per screen: **phone** (today's layout, polished), **tablet** and **desktop** (multi-column layouts that use the width, described below); map side-by-side layout for landscape phones too; no horizontal page scroll from 320 px up; safe-area padding; hover only on devices that hover; long-word wrapping; a written check on the widths below.
- Out of scope: new features, components or steps (the flow map → risks → form → comparison → detail stays the same on every device); copy changes (e.g. badge words in the columns stay icons); visual redesign (colors, fonts, spacing scale stay); a desktop top navigation; dark mode; print styles; anything in `contracts/`, `api/`, `engine/`, `data/`, `web/src/contracts/`.

## The three views

| View | Width | Idea |
|---|---|---|
| Phone | < 768 px (and landscape phones, see below) | One column, as today. Reference: 360 px |
| Tablet | 768-1199 px | Map with a side panel; text screens up to 880 px with two columns where the content splits naturally |
| Desktop | ≥ 1200 px | Map with a wider side panel; text screens up to 1040 px; same two-column structure with more air |

| Screen | Phone | Tablet | Desktop |
|---|---|---|---|
| Map | Header, map, bottom sheet (today) | Map left, panel right 380 px (header, summary card, buttons, demo list in the panel) | Same, panel 420 px (the demo-place list opens as today, from the card link) |
| Risks | One list | Risk rows in a 2-column grid; "continue" button full width below | Same, max 1040 px |
| Form | One scrolling form, three blocks | Two columns: left = primera + postrera crops (crop grid 3 columns); right = priorities + irrigation; submit button full width below both | Same, crop grid 4 columns |
| Comparison | Notes + table (today) | Notes in a row of up to 3 cards above the table; table up to 720 px wide, font 16 px | Same; table 800 px, centered |
| Option detail | One list | Two columns: left = why + evidence; right = benefits, missing data, check with a technician | Same, max 1040 px |

On tablet and desktop the content is centered and the page background fills the rest of the window. Two columns always read left column first, then right (DOM order = reading order = tab order); use CSS grid, never reorder with `order`.

## Target widths (the check matrix)

| Name | Viewport (CSS px) | Must hold |
|---|---|---|
| Small phone | 320 × 568 | No horizontal page scroll; comparison table readable; 5 priority circles in one row |
| Phone (design width) | 360 × 780 | Same as today (this is the reference; nothing gets worse) |
| Large phone | 430 × 932 | Same as today |
| Phone landscape | 780 × 360 | Map and sheet side by side; map at least 50% of the width; sheet scrolls on its own |
| Tablet portrait | 768 × 1024 | Tablet view of every screen (table "The three views") |
| Tablet landscape | 1024 × 768 | Tablet view; map panel does not cover the region |
| Laptop | 1280 × 800 | Desktop view of every screen |
| Large desktop | 1920 × 1080 | Desktop view; content centered, no line longer than ~80 characters |
| Text zoom 200% | 360 × 780, browser zoom 200% | Nothing cut off; buttons still at least 44 px and tappable |

Every row in both languages (`?lang=en` too).

## Design (follow it; ask the lead before changing it)

### Breakpoints

One file, `web/src/ui/layout.ts`:

```ts
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

/** Global layout CSS, rendered once by App in a <style> tag. */
export const LAYOUT_CSS: string;
```

Map side layout = `(min-width: 768px), (orientation: landscape) and (max-height: 500px)`. Text-screen tablet view = `(min-width: 768px)`; desktop view = `(min-width: 1200px)`. A landscape phone gets the map side layout but keeps the phone view of the text screens (they are too short for two columns). Below 768 px, today's layout stays exactly as it is. Build every media query string from `BREAKPOINTS`, never type the numbers twice.

### What `LAYOUT_CSS` contains

1. `html, body`: `overflow-x: hidden` is NOT allowed (it hides bugs). Instead `*, *::before, *::after { box-sizing: border-box }` and `img, svg, canvas { max-width: 100% }`.
2. `.ag-screen` (text screens: risks, form, comparison, detail): `max-width: 560px; margin: 0 auto; padding-inline: 16px`; tablet `max-width: 880px; padding-inline: 24px`; desktop `max-width: 1040px; padding-inline: 32px`.
   - `.ag-cols` (two-column block, used by form, risks and detail): phone = one column; tablet/desktop = `display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px` (desktop 32px). `.ag-cols > .ag-span` spans both columns (submit and continue buttons).
   - `.ag-risk-grid`: phone = list; tablet/desktop = 2-column grid, gap 16px.
   - `.ag-notes`: phone = stacked; tablet/desktop = `display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px`.
   - `.ag-table`: tablet `max-width: 720px; font-size: 16px; margin-inline: auto`; desktop `max-width: 800px`.
   - Primary buttons on tablet/desktop: `max-width: 420px; margin-inline: auto` (a 1000 px wide button is hard to read as a button).
3. `.ag-map-screen`: column, `height: 100dvh` (today's inline style, moved here). Inside the side-layout media query: `flex-direction: row`.
4. `.ag-map-area`: `flex: 1 1 auto; min-height: 200px` (today). Side layout: `min-width: 0; min-height: 0`.
5. `.ag-map-sheet`: today's sheet (`max-height: 50dvh; overflow-y: auto`, rounded top, shadow up). Side layout: `width: 380px` (desktop 420px; `max-width: 50%` on landscape phones), `max-height: none; height: 100%`, no rounded corners, shadow to the left, header (title, language toggle, locate button) moves into the sheet top so the map gets the full height.
6. Safe areas: `.ag-map-sheet` and `.ag-screen` get `padding-bottom: max(16px, env(safe-area-inset-bottom))`; `index.html` viewport meta gets `viewport-fit=cover`.
7. Long words: `.ag-table th, .ag-table td, .ag-note { overflow-wrap: anywhere; hyphens: auto }`.
8. Comparison at 320 px: wrap the table in `.ag-table-wrap { overflow-x: auto }` as a safety net only. At 320 px the row header column goes from 26% to 22% and table `font-size` from 15 px to 14 px (`@media (max-width: 359px)`). The table must still fit without scrolling at 320 px in Spanish; the wrapper only catches a long English word.
9. Form crop grid (`.ag-grid`): phone 2 columns; tablet 3; desktop 4. Priority circles keep 48 px and their row stays in one line in every view.
10. Hover: move `.ag-btn:hover` and `.ag-primary:hover` in `THEME_CSS` inside `@media (hover: hover)`.

Fonts stay in px as today (Chrome and Safari scale them with the phone's text-size setting and browser zoom). Never set a fixed `height` on anything that holds text; use `min-height`. Skeleton placeholders may keep fixed heights.

### Per file

- `web/index.html`: viewport meta `width=device-width, initial-scale=1, viewport-fit=cover`. Do not add `maximum-scale` or `user-scalable=no` (users must be able to zoom).
- `web/src/App.tsx`: render `<style>{LAYOUT_CSS}</style>` once; drop `maxWidth: 480` from `<main>` (each text screen centers itself with `.ag-screen`; the map uses the full width).
- `web/src/features/map/MapScreen.tsx`: replace `screenStyle`, `mapAreaStyle`, `sheetStyle` with the class names above; keep the overlay (`min(60%, 240px)`) and the handle (hide the handle in the side layout: it means "drag up" and there is nothing to drag). Keep the DOM order map → sheet (screen readers and the tab order stay the same).
- `web/src/features/map/MapView.tsx`: the map must resize when the layout flips (rotation, window resize). MapLibre's default `trackResize` handles window resizes; check that a rotation on a real phone redraws the map without a grey band. If it does not, call `map.resize()` from a `ResizeObserver` on the container (no new dependency).
- `web/src/features/risks/RisksScreen.tsx`: `screenStyle` (480 px) → `className="ag-screen"`; the risk `<ul>` gets `ag-risk-grid`.
- `web/src/features/form/FormScreen.tsx`: wrap the blocks in `<div className="ag-cols">` with two children (crops block; priorities + irrigation block) and the submit button as `ag-span`. Same fields, same order, same handlers.
- `web/src/features/comparison/OptionDetail.tsx`: two children inside `ag-cols` (why + evidence; benefits + missing data + local review). Same content and order.
- `web/src/features/comparison/theme.tsx`: `.ag` keeps colors and font but its `max-width`/`margin`/padding move to `.ag-screen` (the `Page` wrapper gets both classes); hover rules inside `@media (hover: hover)`; the 320 px table rules.
- `web/src/features/comparison/ComparisonScreen.tsx`: wrap the table in `<div className="ag-table-wrap">`; the notes above the table get a wrapper with `ag-notes`.

## Tests first (Strict TDD)

jsdom does not lay out pages, so tests check the rules and the class names; the real check is the matrix above in a browser.

| Test file | Failing test to write first |
|---|---|
| `web/src/ui/layout.test.ts` | `LAYOUT_CSS` has the map side-layout media query built from `BREAKPOINTS` (both conditions), a tablet and a desktop media query; `.ag-screen` max width per view equals `CONTENT_MAX_WIDTH`; `.ag-cols` is one column outside the tablet query and two inside it; safe-area padding present; no `overflow-x: hidden` on `html`/`body`; no `user-scalable` anywhere |
| `web/src/features/map/MapScreen.test.tsx` | the screen root has `ag-map-screen`, the map area `ag-map-area`, the sheet `ag-map-sheet`; no inline `height` or `maxHeight` left on them; DOM order is map before sheet |
| `web/src/features/risks/RisksScreen.test.tsx` | the screen root has `ag-screen` and no inline `maxWidth` |
| `web/src/App.test.tsx` | `<main>` has no inline `maxWidth`; exactly one layout `<style>` is rendered |
| `web/src/features/comparison/ComparisonScreen.test.tsx` | the table sits inside `.ag-table-wrap`; the notes sit inside `.ag-notes` |
| `web/src/features/form/FormScreen.test.tsx` | `.ag-cols` has exactly two column children plus the submit button with `ag-span`; crops come before priorities in the DOM; every existing form test still green |
| `web/src/features/risks/RisksScreen.test.tsx` | the risk list has `ag-risk-grid` |
| `web/src/features/comparison/OptionDetail.test.tsx` | `.ag-cols` has two children; "why" and evidence in the first, benefits, gaps and local review in the second |
| `web/src/ui/layout.test.ts` (theme part) | `THEME_CSS` hover rules only appear inside `@media (hover: hover)` |

Keep every existing test green; if one breaks, the layout change changed behavior: fix the code, not the test.

## Manual check (before the PR)

1. `npm --prefix web run dev`, open Chrome DevTools → device toolbar.
2. For each row of the matrix, in `es` and `?lang=en`: walk map → tap a demo place → risks → form → comparison → option detail.
3. Per screen look for: a horizontal scrollbar on the page (fail), text cut off or overlapping (fail), a button under 44 px (fail; DevTools → inspect → computed size), the map not filling its area after a rotation (fail).
4. On a real phone (the Vercel preview URL of your PR): portrait, landscape, and the phone's largest text size.
5. Write `docs/qa/responsive-check.md`: one table, rows = matrix, columns = map / risks / form / comparison / detail, cells pass or fail + one line; screenshots only for failures (`docs/qa/img/`, at most 300 KB each).

## Files to deliver

| Path | Purpose |
|---|---|
| `web/src/ui/layout.ts` + `layout.test.ts` | Breakpoints and global responsive CSS |
| `web/index.html` | `viewport-fit=cover` |
| `web/src/App.tsx` + `App.test.tsx` | Render `LAYOUT_CSS`; drop the 480 px cap |
| `web/src/features/map/MapScreen.tsx` + test | Class names, side layout, handle hidden on the side |
| `web/src/features/map/MapView.tsx` + test | Only if the rotation check fails: resize on container change |
| `web/src/features/risks/RisksScreen.tsx` + test | `.ag-screen`, `.ag-risk-grid` |
| `web/src/features/form/FormScreen.tsx` + test | Two-column wrapper on tablet/desktop |
| `web/src/features/comparison/theme.tsx` | `.ag-screen` on `Page`, hover media query, 320 px table rules |
| `web/src/features/comparison/ComparisonScreen.tsx` + test | `.ag-table-wrap`, `.ag-notes` |
| `web/src/features/comparison/OptionDetail.tsx` + test | Two-column wrapper on tablet/desktop |
| `docs/qa/responsive-check.md` | The check matrix result |
| `docs/si-usage.md` | Your row, if you used AI |

No new entries in `docs/resources.md` are expected (no new library, font or image); if you add one, add its row.

## Conventions

- Class names `ag-` prefix, kebab-case; constants `UPPER_SNAKE_CASE`; code and comments in English.
- Comment the why next to each media query (which device it is for), like the existing comments in `MapScreen.tsx`.
- Branch `feat/web-responsive`; conventional commits with scope, e.g. `feat(web): add shared layout breakpoints`, `feat(web): map side layout on wide and landscape screens`; no AI attribution.
- `make check` green before the PR (Windows: run it locally). PR description in 3 lines: done, not done, surprises; attach the 320 px and landscape screenshots.

## Done when

- [ ] Every row of the matrix passes in `es` and `en` (`docs/qa/responsive-check.md` merged)
- [ ] Tablet and desktop show the views in "The three views" (two columns, side panel), not a stretched phone
- [ ] At 360 × 780 portrait the app looks the same as before (compare against `main`)
- [ ] No horizontal page scroll anywhere from 320 px up
- [ ] Touch targets still at least 44 px at every width and at 200% zoom
- [ ] `make check` green; no new dependency; no copy, contract or behavior change

## Coordination

- Lead: approves this package before work starts (it touches files owned by packages 03 and 04) and updates `docs/spec.md` ("Out of scope: desktop-specific layouts") to allow the tablet and desktop views; reviews the whole PR.
- Package 03 owner (map, risks, App): tell them before you start; they review `MapScreen.tsx`, `MapView.tsx`, `RisksScreen.tsx`, `App.tsx`.
- Package 04 owner (form, comparison): reviews `theme.tsx` and `ComparisonScreen.tsx`.
- Package 08 owner (phone QA): re-runs their row 9 (rotate + text zoom) after the merge.
