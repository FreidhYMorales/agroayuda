// web/src/ui/splashHtml.test.ts
import { beforeAll, describe, expect, test } from "vitest";
// Vite imports the file as text, so the test needs no Node types.
import indexHtml from "../../index.html?raw";

let doc: Document;

beforeAll(() => {
  // DOMParser builds the tree without running the inline script.
  doc = new DOMParser().parseFromString(indexHtml, "text/html");
});

describe("splash markup in index.html", () => {
  test("#splash exists and is not inside #root (React must not replace it)", () => {
    const splash = doc.getElementById("splash");

    expect(splash).not.toBeNull();
    expect(doc.getElementById("root")?.contains(splash)).toBe(false);
  });

  test("#splash is a status region for screen readers", () => {
    expect(doc.getElementById("splash")?.getAttribute("role")).toBe("status");
  });

  test("the logo is decorative and comes from /logo.svg", () => {
    const logo = doc.querySelector("#splash img");

    expect(logo?.getAttribute("src")).toBe("/logo.svg");
    expect(logo?.getAttribute("alt")).toBe("");
  });

  test("the page starts in English, the app's default language", () => {
    expect(doc.documentElement.getAttribute("lang")).toBe("en");
    expect(doc.getElementById("splash")?.hasAttribute("lang")).toBe(false);
  });

  test("an inline script switches the splash to Spanish when the URL has lang=es", () => {
    const script = Array.from(doc.querySelectorAll("script:not([src])"))
      .map((tag) => tag.textContent ?? "")
      .join("\n");

    expect(script).toContain('get("lang") !== "es"');
    expect(script).toContain("Cargando AgroAyuda…");
    expect(script).toContain("Logo generado con IA");
  });

  test("the loading label is in English", () => {
    expect(doc.querySelector(".splash-label")?.textContent?.trim()).toBe("Loading AgroAyuda…");
  });

  test("the AI-generated mark is visible in English", () => {
    expect(doc.querySelector(".splash-ai")?.textContent?.trim()).toBe("AI-generated logo");
  });

  test("the inline style handles reduced motion and has the safety timeout", () => {
    const css = Array.from(doc.querySelectorAll("style"))
      .map((style) => style.textContent ?? "")
      .join("\n");

    expect(css).toContain("prefers-reduced-motion");
    expect(css).toContain("splash-timeout");
  });

  test("the logo is preloaded in the head", () => {
    expect(doc.querySelector('link[rel="preload"][href="/logo.svg"]')).not.toBeNull();
  });
});
