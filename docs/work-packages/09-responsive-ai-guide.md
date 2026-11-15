# Package 09 — how to work it with Claude

A step-by-step guide for the package 09 owner. Read it once, then follow it step by step. The package itself is `09-responsive.md`; this guide only tells you how to drive the AI through it.

The rule: **you lead, the AI executes.** One step per chat message, test first, run it yourself, read the diff, commit. Never paste a whole package and ask for "everything".

## 1. Set up (15 min)

1. `git pull` on `main`, then `git switch -c feat/web-responsive`. Run `make check`: it must be green **before** you change anything. If not, tell the lead.
2. Create a Claude.ai Project named "AgroAyuda 09 responsive".
3. In **Project knowledge**, upload:
   - `docs/work-packages/09-responsive.md` (the package) and this guide
   - `AGENTS.md`
   - `docs/spec.md` (only the "Screens" section is needed; uploading the whole file is fine)
   - The files you will change, as they are in `main` today: `web/index.html`, `web/src/App.tsx`, `web/src/features/map/MapScreen.tsx`, `web/src/features/map/MapView.tsx`, `web/src/features/risks/RisksScreen.tsx`, `web/src/features/form/FormScreen.tsx`, `web/src/features/comparison/theme.tsx`, `web/src/features/comparison/ComparisonScreen.tsx`, `web/src/features/comparison/OptionDetail.tsx`
   - Their tests (same names with `.test.tsx`) and `web/src/ui/buttonStyles.ts` + `buttonStyles.test.ts` (the model for how this repo tests styles)
4. In **Project instructions**, paste:

   > You are helping me implement work package 09 (responsive layout) of AgroAyuda. The package file is the source of truth; follow its "Design" section exactly.
   > Rules: only the files listed under "Files to deliver"; no new dependencies; no changes to copy (Spanish or English), behavior, URL state or contracts.
   > Strict TDD: for each step, first give me ONLY the failing test, wait until I paste the failing output, then give the smallest code that makes it pass.
   > Give whole files, not fragments, unless I ask for a diff. TypeScript strict, Biome style (2 spaces, double quotes).
   > If something seems to need a file outside the list, or the package is unclear, stop and tell me instead of guessing.

5. If you use Claude Code (CLI) instead, skip 2-4: run it in the repo and start with "Read `docs/work-packages/09-responsive.md` and `docs/work-packages/09-responsive-ai-guide.md`; we work step 1 only." The same rules apply.

## 2. The loop (every step)

```
ask for the test → paste it → npm --prefix web run test → it FAILS (good) → paste the failure
→ ask for the code → paste it → test PASSES → make check → open the app and look → read git diff → commit
```

- If the test passes before the code exists, the test is wrong. Tell the AI.
- If an **old** test breaks, the change altered behavior. Paste the failure; fix the code, never the old test.
- Paste errors verbatim (`tsc`, Biome, Vitest). Do not paraphrase.
- After each paste, update that file in Project knowledge (delete the old one, upload the new one). Otherwise the AI works on stale code. With Claude Code this is automatic.
- Start a new chat in the Project for each step: shorter chats make fewer mistakes.

## 3. Steps, in order

Each step is one commit. Copy the prompt, then follow the loop.

### Step 1: layout module

> Step 1: create `web/src/ui/layout.ts` and `layout.test.ts` as in the package's "Breakpoints" and "What LAYOUT_CSS contains" sections. Media queries are built from `BREAKPOINTS`. Test first: the cases listed for `layout.test.ts` in "Tests first".

Check: tests green. Nothing visible changes yet. Commit `feat(web): add shared layout breakpoints and css`.

### Step 2: App shell and viewport

> Step 2: `App.tsx` renders `<style>{LAYOUT_CSS}</style>` once and drops `maxWidth: 480` from `<main>`; `index.html` viewport gets `viewport-fit=cover`. Test first (the `App.test.tsx` row).

Check in the browser at 360 px: the map screen looks the same as before. Commit `feat(web): render layout css and drop the 480 px cap`.

### Step 3: map screen

> Step 3: `MapScreen.tsx` uses the `ag-map-screen`, `ag-map-area`, `ag-map-sheet` classes instead of the inline styles; the side layout moves the header into the panel and hides the handle. Keep the DOM order map → sheet. Test first (the `MapScreen.test.tsx` row). Mock `maplibre-gl` as the existing tests do.

Check at 360 × 780, 780 × 360, 768 × 1024, 1280 × 800. Rotate the DevTools device: does the map redraw? If not, do step 3b. Commit `feat(web): map side layout on wide and landscape screens`.

**Step 3b (only if the map leaves a grey band after rotating):**

> Step 3b: in `MapView.tsx`, call `map.resize()` from a `ResizeObserver` on the container, disconnected on unmount. Test first: the observer callback calls `resize` on the mocked map.

### Step 4: risks

> Step 4: `RisksScreen.tsx` uses `ag-screen` instead of `screenStyle`, and the risk list gets `ag-risk-grid`. Test first (the `RisksScreen.test.tsx` rows).

Commit `feat(web): risks screen in two columns on tablet and desktop`.

### Step 5: theme and form

> Step 5: in `theme.tsx`, `Page` gets `ag ag-screen`, the width rules move to `.ag-screen`, hover rules go inside `@media (hover: hover)`, and the crop grid gets 3/4 columns. In `FormScreen.tsx`, wrap the blocks in `ag-cols` (crops block, then priorities + irrigation block) with the submit button as `ag-span`. Same fields, order and handlers. Test first (the `FormScreen.test.tsx` row and the theme hover row).

Check: fill the whole form at 360 px and at 1280 px; the URL keeps the answers. Commit `feat(web): form in two columns on tablet and desktop`.

### Step 6: comparison and detail

> Step 6: `ComparisonScreen.tsx` wraps the table in `ag-table-wrap` and the notes in `ag-notes`; the 320 px table rules go in `theme.tsx`. `OptionDetail.tsx` uses `ag-cols` with two children as in the package. Test first (the `ComparisonScreen` and `OptionDetail` rows).

Check at 320 px in Spanish: the table fits **without** scrolling. In English a sideways scroll inside the table is acceptable, but never on the page. Commit `feat(web): comparison and detail layouts for tablet and desktop`.

### Step 7: check matrix and PR

1. Walk the "Manual check" of the package for every matrix row, in `es` and `?lang=en`.
2. Ask the AI only for the empty table of `docs/qa/responsive-check.md`. **You** fill in pass/fail from what you saw; the AI did not see your screen.
3. Fix failures with one small step each (same loop).
4. Fill your row in `docs/si-usage.md`: "Claude (Claude.ai Project): drafted tests and CSS per step; every step run and reviewed by me".
5. `make check` → push → open the PR (done / not done / surprises + screenshots at 320 px and landscape). Test the Vercel preview link on your real phone.

## 4. When the AI goes off track

| It does this | You say |
|---|---|
| Edits a file outside the list | "That file is not in Files to deliver. Undo it and tell me why you needed it." Then ask the lead. |
| Adds a library (Tailwind, styled-components, react-responsive…) | "No new dependencies. Plain CSS media queries in `LAYOUT_CSS`." |
| Rewrites copy or changes a button label | "Copy stays exactly as it is. Revert the text." |
| Uses `window.innerWidth` or a `useMediaQuery` hook for layout | "Layout is CSS only. Remove the JS." (Exception: step 3b `ResizeObserver`.) |
| Sets `overflow-x: hidden` on body to "fix" a scroll | "That hides the bug. Find the element that is too wide." (DevTools: look for an element wider than the viewport.) |
| Gives code before the test | "Test first. Only the test, then wait." |
| Changes an old test so it passes | "Old tests are the contract. Revert the test and fix the code." |
| Says "done" without you running anything | Run it. Done means `make check` green plus your own look in the browser. |

## 5. Never

- Paste `.env`, tokens or keys into the chat.
- Merge without `make check` green and the lead's review.
- Commit with AI attribution lines (`Co-Authored-By`, "generated by").
