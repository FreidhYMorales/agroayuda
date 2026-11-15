# Responsive check (work package 09)

Result of the check matrix in `docs/work-packages/09-responsive.md`, on branch `feat/web-responsive`, Sun 2026-11-15.

## How it was checked

- Local app: `npm --prefix web run dev` with the local API (`uv run fastapi run api/src/api/main.py`), real pipeline data.
- Browser: Microsoft Edge (Chromium) headless, driven through the DevTools protocol with device emulation at the exact viewport of each row (touch and `mobile` on for phone sizes). Text zoom 200% = a 180 × 390 CSS px viewport (360 × 780 at 200%).
- Flow per row and language: map with Chiquimula picked → risks → form (maíz → frijol) → comparison → option detail (first column).
- Measured on every screen: horizontal page scroll (`scrollWidth` vs viewport), elements past the right edge, any button, link or input smaller than 44 × 44 px. Map: share of the width the map takes. Comparison: whether the table scrolls inside `.ag-table-wrap`. Laptop and desktop: estimated longest text line.
- Rotation: a phone emulated at 360 × 780, turned to 780 × 360 and back without reloading; the map canvas followed its area each time (no grey band), so the `MapView.tsx` resize step (3b) was not needed.
- The basemap tiles do not load in headless Edge, so the map shows its fallback (regional layers on a plain background) in these runs; the layout is the same.
- Baseline: `main` fails the 200% row too (map and form scroll sideways, comparison page 184 px wide); this branch fixes all three.

## Matrix

### Spanish (`es`)

| Width | Map | Risks | Form | Comparison | Detail |
|---|---|---|---|---|---|
| Small phone 320 × 568 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Phone 360 × 780 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Large phone 430 × 932 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Phone landscape 780 × 360 | pass: map 51% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Tablet portrait 768 × 1024 | pass: map 51% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Tablet landscape 1024 × 768 | pass: map 63% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Laptop 1280 × 800 | pass: map 67% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Large desktop 1920 × 1080 | pass: map 78% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Text zoom 200% (360 × 780 at 200%) | pass: map 100% wide | pass: ok | pass: ok | pass: table scrolls inside its frame, page does not | pass: ok |

### English (`?lang=en`)

| Width | Map | Risks | Form | Comparison | Detail |
|---|---|---|---|---|---|
| Small phone 320 × 568 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Phone 360 × 780 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Large phone 430 × 932 | pass: map 100% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Phone landscape 780 × 360 | pass: map 51% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Tablet portrait 768 × 1024 | pass: map 51% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Tablet landscape 1024 × 768 | pass: map 63% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Laptop 1280 × 800 | pass: map 67% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Large desktop 1920 × 1080 | pass: map 78% wide | pass: ok | pass: ok | pass: table fits | pass: ok |
| Text zoom 200% (360 × 780 at 200%) | pass: map 100% wide | pass: ok | pass: ok | pass: table scrolls inside its frame, page does not | pass: ok |

"Map 100% wide" on phones = the map takes the full width above the sheet (phone layout). From 768 px and on landscape phones the map sits left of the side panel.

## Still to check by hand

| Check | Status |
|---|---|
| Real phone, portrait and landscape, on the Vercel preview of the PR | Pending (owner, before merge) |
| Real phone at the largest system text size | Pending (owner, before merge) |
| Safari on iPhone (safe area under the home bar, rotation) | Pending (needs an iPhone) |
| Basemap tiles drawn after a rotation on a real phone | Pending (owner) |
