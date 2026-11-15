// web/src/ui/splash.test.ts
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { SPLASH_FADE_MS, SPLASH_MIN_MS, hideSplash } from "./splash";

// A fresh document per test, so nothing leaks between cases.
function makeDoc(withSplash = true): Document {
  const doc = document.implementation.createHTMLDocument("splash-test");
  if (withSplash) {
    doc.body.innerHTML = '<div id="splash"></div>';
  }
  return doc;
}

function splashOf(doc: Document): HTMLElement | null {
  return doc.getElementById("splash");
}

describe("hideSplash", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("does nothing when there is no #splash in the document", () => {
    const doc = makeDoc(false);

    expect(() => hideSplash({ doc, elapsedMs: 0, reduceMotion: false })).not.toThrow();
    vi.runAllTimers();
    expect(splashOf(doc)).toBeNull();
  });

  test("waits for the minimum time, then fades, then removes the element", () => {
    const doc = makeDoc();

    hideSplash({ doc, elapsedMs: 0, reduceMotion: false });

    vi.advanceTimersByTime(SPLASH_MIN_MS - 1); // 799 ms
    expect(splashOf(doc)?.classList.contains("is-leaving")).toBe(false);

    vi.advanceTimersByTime(1); // 800 ms
    expect(splashOf(doc)?.classList.contains("is-leaving")).toBe(true);

    vi.advanceTimersByTime(SPLASH_FADE_MS - 1); // 1099 ms
    expect(splashOf(doc)).not.toBeNull();

    vi.advanceTimersByTime(1); // 1100 ms
    expect(splashOf(doc)).toBeNull();
  });

  test("starts leaving right away when the page already took longer than the minimum", () => {
    const doc = makeDoc();

    hideSplash({ doc, elapsedMs: 2000, reduceMotion: false });

    vi.advanceTimersByTime(0);
    expect(splashOf(doc)?.classList.contains("is-leaving")).toBe(true);
    expect(splashOf(doc)).not.toBeNull();

    vi.advanceTimersByTime(SPLASH_FADE_MS);
    expect(splashOf(doc)).toBeNull();
  });

  test("with reduced motion it skips both waits", () => {
    const doc = makeDoc();

    hideSplash({ doc, elapsedMs: 0, reduceMotion: true });

    // Far less than SPLASH_MIN_MS: the 800 ms wait must not apply.
    vi.advanceTimersByTime(1);
    expect(splashOf(doc)).toBeNull();
  });

  test("calling it twice does not throw", () => {
    const doc = makeDoc();

    expect(() => {
      hideSplash({ doc, elapsedMs: 0, reduceMotion: false });
      hideSplash({ doc, elapsedMs: 0, reduceMotion: false });
      vi.runAllTimers();
    }).not.toThrow();
    expect(splashOf(doc)).toBeNull();
  });
});
