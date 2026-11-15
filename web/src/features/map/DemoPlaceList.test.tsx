// web/src/features/map/DemoPlaceList.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { DemoPoint } from "../../contracts/contracts";
import { DemoPlaceList } from "./DemoPlaceList";
import { chiquimulaPlace, demoPlaces, outsidePlace } from "./siteFixture";

afterEach(cleanup);

function renderList(places: DemoPoint[] = demoPlaces) {
  const onPick = vi.fn();
  render(<DemoPlaceList places={places} onPick={onPick} />);
  return { onPick };
}

describe("DemoPlaceList", () => {
  test("shows one button per place with its Spanish name", () => {
    renderList();

    expect(screen.getByRole("button", { name: "Chiquimula" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Punto fuera de la región" })).toBeTruthy();
    expect(screen.getAllByRole("button")).toHaveLength(2);
  });

  test("lists the places in the order received", () => {
    renderList([outsidePlace, chiquimulaPlace]);

    const items = screen.getAllByRole("listitem");

    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain("Punto fuera de la región");
    expect(items[1].textContent).toContain("Chiquimula");
  });

  test("picking a place calls onPick with that place", () => {
    const { onPick } = renderList();

    fireEvent.click(screen.getByRole("button", { name: "Chiquimula" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(chiquimulaPlace);
  });

  test("the point outside the region is pickable like any other", () => {
    const { onPick } = renderList();

    fireEvent.click(screen.getByRole("button", { name: "Punto fuera de la región" }));

    expect(onPick).toHaveBeenCalledTimes(1);
    expect(onPick).toHaveBeenCalledWith(outsidePlace);
  });

  test("does not call onPick until a place is tapped", () => {
    const { onPick } = renderList();

    expect(onPick).not.toHaveBeenCalled();
  });
});
