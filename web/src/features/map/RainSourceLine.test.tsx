// web/src/features/map/RainSourceLine.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import type { RainCellProperties } from "../../contracts/contracts";
import { RainSourceLine } from "./RainSourceLine";

afterEach(cleanup);

const LINE = "Dato: NASA POWER ›";
// Same shape as a cell of the real rain.geojson (61.7 km rounds to 60).
const DETAIL = "NASA POWER (PRECTOTCORR diario, 1991-2020) · celdas de unos 60 km";

const properties: RainCellProperties = {
  value_mm: 1396.1,
  unit: "mm/año",
  source: "NASA POWER (PRECTOTCORR diario, 1991-2020)",
  resolution_km: 61.7,
};

function renderLine() {
  const { container } = render(<RainSourceLine properties={properties} />);
  return { container, button: screen.getByRole("button", { name: LINE }) };
}

describe("RainSourceLine", () => {
  test("shows the exact source line and keeps the detail closed at first", () => {
    const { button } = renderLine();

    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByText(DETAIL)).toBeNull();
  });

  test("a tap opens the source and the cell size", () => {
    const { button } = renderLine();

    fireEvent.click(button);

    expect(screen.getByText(DETAIL)).toBeTruthy();
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });

  test("a second tap closes the detail again", () => {
    const { button } = renderLine();

    fireEvent.click(button);
    fireEvent.click(button);

    expect(screen.queryByText(DETAIL)).toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  test("uses text only: no NASA logo or any image", () => {
    const { container, button } = renderLine();

    fireEvent.click(button);

    expect(container.querySelector("img, svg")).toBeNull();
  });
});
