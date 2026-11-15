# Work package 10: Web — opening splash with the logo

Estimate: 2-3 hours · Depends on: package 03 (App shell, `index.html`, `main.tsx`) merged in `main` · Do not merge during a demo recording.

How to work this package with Claude, step by step: `10-splash-ai-guide.md` (read it first).

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Only create or edit the files listed under "Files to deliver".
> Do not change contracts, screens, copy of existing screens, behavior, URL state or data flow.
> Do not add dependencies (no animation library, no React splash component library): plain HTML, CSS and one small TypeScript module.
> Write the failing test first, then the code (Strict TDD). Tests never call the network.
> If a change seems needed outside these files, tell me instead of making it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026). On a slow phone connection the page is blank (cream background) until the JavaScript bundle downloads and React renders the map screen. We want a short opening animation with the team logo that covers that wait.

Today:

- `web/index.html` has only `<div id="root">` and the cream `body` background (`#faf7f0`, same as `COLORS.background` in `web/src/ui/colors.ts`).
- `web/src/main.tsx` renders `<App />` into `#root`.
- The language comes from the URL: `?lang=en` is English, anything else is Spanish (`web/src/lib/urlState.ts`).
- There is no logo in the repo yet. It comes with this package: `logo.svg` (vector, transparent background, `viewBox="0 0 1968 1612"`, no fixed size, ~87 KB). It shows the icon plus the words "AgroAyuda" and "Siembra y Clima", so the splash needs no visible title.
- The logo was made with ChatGPT (image generation) and vectorized with vtracer + ImageMagick. Project rules (`AGENTS.md`, `docs/si-usage.md`) require a visible "AI-generated" mark on any SI-generated image.

## Scope

- In: a splash screen that shows on **every full page load** (first visit, reload, a new tab); logo entrance animation and a gentle "breathing" loop while loading; fade-out once React has rendered; the AI-generated mark; reduced-motion support; a safety timeout so the splash never blocks the app; the logo file in `web/public/`.
- Out of scope: a splash between screens (map → risks → form …): in-app navigation does not reload the page; a service worker or PWA install screen; a favicon or app icons (separate task: the full logo with text is unreadable at 16-32 px); animating separate parts of the logo (sun, leaves): the SVG is one traced image; any change to `App.tsx` or the screens.

## Why the splash lives in `index.html`, not in React

The browser paints `index.html` as soon as it arrives, before the bundle downloads. A React splash component would only appear after the bundle has loaded, i.e. after the long wait it is supposed to cover. So: markup and CSS inline in `index.html`, outside `#root` (React must not replace it), and one small TypeScript module that removes it after the first render.

## Design

### Markup (in `web/index.html`, before `<div id="root">`)

```html
<div id="splash" role="status" aria-live="polite">
  <img class="splash-logo" src="/logo.svg" alt="" width="240" height="197" fetchpriority="high" />
  <p class="splash-label">Cargando AgroAyuda…</p>
  <p class="splash-ai">Logo generado con IA</p>
</div>
```

- `alt=""`: the logo is decorative here; the status text names the app for screen readers.
- `width`/`height` keep the aspect ratio (1968:1612) and avoid a layout jump while the SVG loads.
- `splash-label` is visible, small, under the logo (it tells a farmer on a slow phone that something is happening).
- Add `<link rel="preload" href="/logo.svg" as="image" />` in `<head>`.

### Language

A tiny inline `<script>` right after the splash markup (not a module, so it runs immediately) sets the texts when the URL has `lang=en`:

| Element | Spanish (default) | English (`?lang=en`) |
|---|---|---|
| `.splash-label` | Cargando AgroAyuda… | Loading AgroAyuda… |
| `.splash-ai` | Logo generado con IA | AI-generated logo |

It only reads `new URLSearchParams(location.search).get("lang") === "en"`, same rule as `urlState.ts`. It must not throw if the elements are missing.

### Look and animation (inline `<style>` in `index.html`)

| Part | Rule |
|---|---|
| Container `#splash` | `position: fixed; inset: 0; z-index: 1000;` centered column (flex), background `#faf7f0`, text color `#1e2a22`, safe-area padding (`env(safe-area-inset-*)`) |
| Logo size | `width: min(60vw, 240px); height: auto;` (fits a 320 px phone and does not grow on desktop) |
| Entrance | `splash-in`: 600 ms `ease-out`, opacity 0 → 1 and `scale(0.92)` → `scale(1)` |
| While loading | `splash-breathe`: starts after the entrance (`animation-delay: 600ms`), 1.6 s `ease-in-out`, infinite alternate, `scale(1)` → `scale(1.03)` |
| Label | 16 px, color `#1e2a22`; fades in with a 300 ms delay |
| AI mark | 12 px, color `#4a5656` (contrast ≥ 4.5:1 on `#faf7f0`), at the bottom of the screen above the safe area |
| Leaving | class `is-leaving` → `opacity: 0` with a 300 ms `transition`; `pointer-events: none` |
| Safety timeout | `splash-timeout` animation on `#splash`: after 10 s, `opacity: 0; visibility: hidden` (`animation-fill-mode: forwards`), so a JS error can never leave the user stuck behind the splash |
| Reduced motion | `@media (prefers-reduced-motion: reduce)`: no entrance, no breathing, no fade (the safety timeout stays) |

Only `transform` and `opacity` are animated (cheap on low-end phones). No JS animation.

### Removing it: `web/src/ui/splash.ts`

```ts
export const SPLASH_MIN_MS = 800;  // the entrance animation must be seen, not a flash
export const SPLASH_FADE_MS = 300; // must match the CSS transition

export function hideSplash(options?: {
  doc?: Document;          // default: document
  elapsedMs?: number;      // default: performance.now() (ms since navigation start)
  reduceMotion?: boolean;  // default: matchMedia("(prefers-reduced-motion: reduce)").matches
}): void
```

Behavior:

1. No `#splash` in the document → do nothing (no error).
2. Wait `max(0, SPLASH_MIN_MS - elapsedMs)` ms (0 with reduced motion), then add `is-leaving`.
3. Wait `SPLASH_FADE_MS` (0 with reduced motion), then remove the element from the DOM.
4. Calling it twice must not throw.

No artificial delay beyond `SPLASH_MIN_MS`: on a fast connection the app is ready in < 800 ms, so the splash shows the entrance once and leaves; on a slow one it stays exactly as long as loading takes.

`web/src/main.tsx` calls `hideSplash()` once, right after `createRoot(root).render(...)`, inside `requestAnimationFrame` so the first frame of the app is painted before the splash starts to fade.

## Tests first

| Test file | Cases |
|---|---|
| `web/src/ui/splash.test.ts` | (1) no `#splash` → no throw; (2) `elapsedMs: 0` → after 799 ms no `is-leaving`, at 800 ms `is-leaving`, at 1100 ms element removed; (3) `elapsedMs: 2000` → `is-leaving` immediately (0 ms timer), removed after 300 ms; (4) `reduceMotion: true` → removed after running pending timers with no 800 ms wait; (5) calling twice does not throw. Use `vi.useFakeTimers()` and build the element in jsdom |
| `web/src/ui/splashHtml.test.ts` | Reads `web/index.html` as text (`node:fs`, path from `import.meta.url`) and parses it with `DOMParser`: `#splash` exists and is **not** inside `#root`; it has `role="status"`; the logo `img` has `src="/logo.svg"` and `alt=""`; `.splash-ai` text is "Logo generado con IA"; the inline style contains `prefers-reduced-motion` and `splash-timeout`; `<link rel="preload" href="/logo.svg">` exists |
| `web/src/App.test.tsx` and all existing tests | Stay green untouched (the splash is outside React) |

The language script is checked manually (below); it is three lines and runs before any module.

## Manual check (before the PR)

1. `npm --prefix web run build && npm --prefix web run preview`, open the preview URL in Chrome.
2. DevTools → Network → throttle "Slow 4G", disable cache, reload: the logo enters, breathes while loading, fades out when the map shows. No blank cream page before the logo.
3. Same with no throttling: the entrance shows once (~0.8 s), no flicker.
4. `?lang=en`: label and AI mark in English.
5. DevTools → Rendering → "Emulate prefers-reduced-motion: reduce": the logo shows without motion and disappears without a fade.
6. Widths 320 × 568, 360 × 780, 780 × 360 (landscape), 1280 × 800: the logo fits, nothing scrolls, the AI mark is visible.
7. Break it on purpose: in `main.tsx` comment out the `hideSplash()` call → after 10 s the splash disappears anyway. Restore the call.
8. On a real phone, the Vercel preview URL of your PR: open it in a new tab twice.
9. Screen reader (TalkBack or VoiceOver) announces "Cargando AgroAyuda…" and does not read the logo.

## Files to deliver

| Path | Purpose |
|---|---|
| `web/public/logo.svg` | The logo (from this package's zip, unchanged) |
| `web/index.html` | Splash markup, inline style, language script, logo preload |
| `web/src/ui/splash.ts` + `splash.test.ts` | `hideSplash()` and its timing constants |
| `web/src/ui/splashHtml.test.ts` | Checks on the splash markup in `index.html` |
| `web/src/main.tsx` | Call `hideSplash()` after the first render |
| `docs/resources.md` | Rows below |
| `docs/si-usage.md` | Row below, plus your own row if you used AI |

Rows to add to `docs/resources.md`, table "Tools and services":

```
| ChatGPT image generation (OpenAI), SI | https://chatgpt.com | Team logo (AI-generated, marked on the splash) |
| VTracer (visioncortex) | https://github.com/visioncortex/vtracer | Converting the logo image to SVG |
| ImageMagick | https://imagemagick.org | Cleaning the logo image before vectorizing |
```

Row to add to `docs/si-usage.md`, table "Audio, images and video" (above "Images or video frames"):

```
| Team logo (splash screen) | Generated with ChatGPT from the team's idea; vectorized with VTracer | Visible text "Logo generado con IA" / "AI-generated logo" on the splash screen |
```

## Conventions

- CSS classes and keyframes `splash-` prefix, kebab-case; constants `UPPER_SNAKE_CASE`; code and comments in English; UI texts as in the table above.
- Comment the why next to the safety timeout and the reduced-motion rule.
- Branch `feat/web-splash`; conventional commits with scope, e.g. `feat(web): add splash removal module`, `feat(web): opening splash with the logo`; no AI attribution.
- `make check` green before the PR (Windows: run it locally). PR description in 3 lines: done, not done, surprises; attach a short screen recording of step 2 of the manual check.

## Done when

- [ ] The splash shows on every full page load and leaves after React renders (min 0.8 s, fade 0.3 s)
- [ ] No blank page before the logo on "Slow 4G"
- [ ] English texts with `?lang=en`
- [ ] Reduced motion: no animation; safety timeout works at 10 s
- [ ] "Logo generado con IA" visible; `docs/resources.md` and `docs/si-usage.md` rows added
- [ ] Fits 320 px to 1280 px, portrait and landscape, without page scroll
- [ ] `make check` green; no new dependency; no change to `App.tsx` or the screens

## Coordination

- Lead: approves this package before work starts, reviews the whole PR.
- Package 03 owner (App shell): tell them before you start; they review `index.html` and `main.tsx`.
- Package 08 owner (phone QA, demo): re-runs the demo on a real phone after the merge; the splash must not delay the recording more than the load itself.
