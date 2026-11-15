// web/src/ui/splash.ts

export const SPLASH_MIN_MS = 800; // the entrance animation must be seen, not a flash
export const SPLASH_FADE_MS = 300; // must match the CSS transition in index.html

interface HideSplashOptions {
  doc?: Document; // default: document
  elapsedMs?: number; // default: performance.now() (ms since navigation start)
  reduceMotion?: boolean; // default: matchMedia("(prefers-reduced-motion: reduce)").matches
}

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function hideSplash(options: HideSplashOptions = {}): void {
  const doc = options.doc ?? document;
  const splash = doc.getElementById("splash");
  if (!splash) return;

  const reduceMotion = options.reduceMotion ?? prefersReducedMotion();
  const elapsedMs = options.elapsedMs ?? performance.now();

  // With reduced motion there is no animation to show, so no minimum time and no fade.
  const waitMs = reduceMotion ? 0 : Math.max(0, SPLASH_MIN_MS - elapsedMs);
  const fadeMs = reduceMotion ? 0 : SPLASH_FADE_MS;

  setTimeout(() => {
    splash.classList.add("is-leaving");
    // Element.remove() on an already detached element does nothing, so a second call is safe.
    setTimeout(() => splash.remove(), fadeMs);
  }, waitMs);
}
