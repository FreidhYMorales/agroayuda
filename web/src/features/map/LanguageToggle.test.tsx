// web/src/features/map/LanguageToggle.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import { LANGUAGE_TOGGLE_CSS, LanguageToggle } from "./LanguageToggle";

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

test("is one group of two languages, named in both languages, Spanish by default", () => {
  render(<LanguageToggle />);

  const group = screen.getByRole("radiogroup", { name: "Idioma / Language" });
  expect(group).toBeTruthy();
  expect(screen.getByRole("radio", { name: "Español" })).toHaveProperty("checked", true);
  expect(screen.getByRole("radio", { name: "English" })).toHaveProperty("checked", false);
  expect(screen.getByText("ES")).toBeTruthy();
  expect(screen.getByText("EN")).toBeTruthy();
});

test("picking English puts lang=en in the URL; picking Español takes it out", () => {
  render(<LanguageToggle />);

  fireEvent.click(screen.getByRole("radio", { name: "English" }));
  expect(new URLSearchParams(window.location.search).get("lang")).toBe("en");
  expect(screen.getByRole("radio", { name: "English" })).toHaveProperty("checked", true);

  fireEvent.click(screen.getByRole("radio", { name: "Español" }));
  expect(new URLSearchParams(window.location.search).has("lang")).toBe(false);
  expect(screen.getByRole("radio", { name: "Español" })).toHaveProperty("checked", true);
});

test("the sliding thumb follows the current language", () => {
  window.history.replaceState(null, "", "/?lang=en");
  const { container } = render(<LanguageToggle />);

  expect(container.querySelector(".ag-lang")?.getAttribute("data-lang")).toBe("en");
});

test("each side is a touch target of at least 44 px", () => {
  render(<LanguageToggle />);

  for (const name of ["Español", "English"]) {
    const side = screen.getByRole("radio", { name }).closest("label") as HTMLElement;
    expect(Number.parseInt(side.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
    expect(Number.parseInt(side.style.minWidth, 10)).toBeGreaterThanOrEqual(44);
  }
});

test("keyboard focus is visible and the slide stops with reduced motion", () => {
  expect(LANGUAGE_TOGGLE_CSS).toMatch(/\.ag-lang input:focus-visible\s*\+\s*span\{[^}]*outline/);
  expect(LANGUAGE_TOGGLE_CSS).toMatch(
    /@media \(prefers-reduced-motion:reduce\)\{\.ag-lang-thumb\{transition:none\}\}/,
  );
});
