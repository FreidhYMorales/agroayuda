# Package 10 — how to work it with Claude

A step-by-step guide for the package 10 owner. Read it once, then follow it step by step. The package itself is `10-splash.md`; this guide only tells you how to drive the AI through it.

The rule: **you lead, the AI executes.** One step per chat message, test first, run it yourself, read the diff, commit. Never paste the whole package and ask for "everything".

## 1. Set up (15 min)

1. `git pull` on `main`, then `git switch -c feat/web-splash`. Run `make check`: it must be green **before** you change anything. If not, tell the lead.
2. Copy `logo.svg` from the zip to `web/public/logo.svg` (create `web/public/` if it does not exist). Do not edit or re-export it.
3. Create a Claude.ai Project named "AgroAyuda 10 splash".
4. In **Project knowledge**, upload from the zip (or from the repo, as they are in `main` today):
   - `10-splash.md` (the package) and this guide
   - `AGENTS.md`
   - `web/index.html`, `web/src/main.tsx`, `web/src/ui/colors.ts`, `web/src/lib/urlState.ts`
   - `web/src/ui/buttonStyles.test.ts` (the model for how this repo writes tests)
   - Do **not** upload `logo.svg`: it is large and the AI does not need its content.
5. In **Project instructions**, paste:

   > You are helping me implement work package 10 (opening splash) of AgroAyuda. The package file is the source of truth; follow its "Design" section exactly.
   > Rules: only the files listed under "Files to deliver"; no new dependencies; no changes to `App.tsx`, the screens, contracts or URL state.
   > Strict TDD: for each step, first give me ONLY the failing test, wait until I paste the failing output, then give the smallest code that makes it pass.
   > Give whole files, not fragments, unless I ask for a diff. TypeScript strict, Biome style (2 spaces, double quotes).
   > If something seems to need a file outside the list, or the package is unclear, stop and tell me instead of guessing.

6. If you use Claude Code (CLI) instead, skip 3-5: run it in the repo and start with "Read `docs/work-packages/10-splash.md` and `docs/work-packages/10-splash-ai-guide.md`; we work step 1 only." The same rules apply.

## 2. The loop (every step)

```
ask for the test → paste it → npm --prefix web run test → it FAILS (good) → paste the failure
→ ask for the code → paste it → test PASSES → make check → open the app and look → read git diff → commit
```

- If the test passes before the code exists, the test is wrong. Tell the AI.
- If an **old** test breaks, the change altered behavior. Paste the failure; fix the code, never the old test.
- Paste errors verbatim (`tsc`, Biome, Vitest). Do not paraphrase.
- After each paste, update that file in Project knowledge (delete the old one, upload the new one). With Claude Code this is automatic.
- Start a new chat in the Project for each step: shorter chats make fewer mistakes.

## 3. Steps, in order

Each step is one commit.

### Step 1: the removal module

> Step 1: create `web/src/ui/splash.ts` and `splash.test.ts` as in the package's "Removing it" section. Test first: the five cases listed for `splash.test.ts` in "Tests first". Use `vi.useFakeTimers()`; pass `doc`, `elapsedMs` and `reduceMotion` explicitly in the tests.

Check: tests green. Nothing visible changes yet. Commit `feat(web): add splash removal module`.

### Step 2: the splash markup and style

> Step 2: add the splash to `web/index.html` as in "Markup", "Look and animation" and "Language" (inline `<style>` and inline `<script>`, plus the logo preload). Test first: `web/src/ui/splashHtml.test.ts` with the cases listed in "Tests first".

Check: `npm --prefix web run dev`; the splash appears and **stays** (nothing removes it yet) until the 10 s safety timeout hides it. That proves the timeout works. Commit `feat(web): opening splash with the logo`.

### Step 3: wire it

> Step 3: in `web/src/main.tsx`, call `hideSplash()` once inside `requestAnimationFrame`, right after `createRoot(root).render(...)`. No other change.

Check: the splash leaves after ~0.8 s. Run the whole "Manual check" of the package (use `build` + `preview` for the throttled test; the dev server does not show real load times). Commit `feat(web): hide the splash after the first render`.

### Step 4: docs

> Step 4: give me the rows for `docs/resources.md` and `docs/si-usage.md` exactly as in "Files to deliver". The lead gives me the image tool name.

Add them by hand. Add your own row in `docs/si-usage.md` if you used AI. Commit `docs: list the logo tools and its AI use`.

## 4. Before the PR

1. `make check` green (on Windows, run it locally).
2. `git diff main --stat`: only the files in "Files to deliver". Anything else → undo it or ask the lead.
3. Read the whole diff yourself. Look for: `App.tsx` or screens touched (not allowed), a hard-coded delay longer than 800 ms, a `setTimeout` without the constants, the splash inside `#root`.
4. Open the PR: 3 lines (done, not done, surprises) and the short recording of the "Slow 4G" load.

## 5. If you get stuck

| Symptom | Likely cause | What to do |
|---|---|---|
| The splash flashes and disappears instantly | `hideSplash()` ignores `elapsedMs` or the min time is 0 | Re-run step 1 tests; check `SPLASH_MIN_MS` is used |
| The splash never leaves (before 10 s) | `#splash` is inside `#root`, or `main.tsx` does not call `hideSplash()` | Check the markup order and step 3 |
| The logo does not show in the preview/Vercel | Wrong path: it must be `web/public/logo.svg` and `src="/logo.svg"` | Fix the path, not the file |
| `splashHtml.test.ts` cannot find `index.html` | Relative path resolved from the wrong folder | Build it from `new URL("../../index.html", import.meta.url)` |
| Biome complains about the inline script | Biome does not lint `index.html`; the error is in a `.ts` file | Paste the error verbatim to the AI |
| The AI wants to add a library or a React `<Splash>` component | It ignored "Why the splash lives in index.html" | Say no and paste that section again |
