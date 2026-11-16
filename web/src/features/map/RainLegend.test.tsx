// web/src/features/map/RainLegend.test.tsx
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { RainLegend } from "./RainLegend";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

afterEach(cleanup);

describe("RainLegend", () => {
  test("names both ends of the scale in words, not only in color", () => {
    render(<RainLegend />);

    expect(screen.getByText("poca lluvia")).toBeTruthy();
    expect(screen.getByText("mucha")).toBeTruthy();
  });

  test("reads poca lluvia first and mucha last, with nothing else in between", () => {
    const { container } = render(<RainLegend />);

    expect(container.textContent).toMatch(/^poca lluvia\s*mucha$/);
  });

  test("has a color bar that is hidden from assistive tech, since the words carry the meaning", () => {
    render(<RainLegend />);

    expect(screen.getByTestId("rain-legend-bar").getAttribute("aria-hidden")).toBe("true");
  });
});
