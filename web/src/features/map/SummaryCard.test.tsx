// web/src/features/map/SummaryCard.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { SiteProfile } from "../../contracts/contracts";
import { bareFieldRisk, caniculaRisk, chiquimulaSite } from "./siteFixture";
import { SummaryCard } from "./SummaryCard";

afterEach(cleanup);

function renderCard(site: SiteProfile = chiquimulaSite, placeName?: string) {
  const handlers = {
    onViewRisks: vi.fn(),
    onViewRecommendations: vi.fn(),
    onPickPlace: vi.fn(),
  };
  render(<SummaryCard site={site} placeName={placeName} {...handlers} />);
  return handlers;
}

describe("SummaryCard title", () => {
  test("shows the demo place name when one was picked from the list", () => {
    renderCard(chiquimulaSite, "Chiquimula");

    expect(screen.getByText("Chiquimula")).toBeTruthy();
    expect(screen.queryByText("Su zona")).toBeNull();
  });

  test("reads Su zona when no place was picked", () => {
    renderCard();

    expect(screen.getByText("Su zona")).toBeTruthy();
  });
});

describe("SummaryCard zone line", () => {
  test("says the zone is regional data, not the farmer's plot", () => {
    renderCard();

    expect(
      screen.getByText("Zona de unos 60 km de lado (dato regional, no de su parcela)"),
    ).toBeTruthy();
  });

  test("takes the size from cell_resolution_km", () => {
    renderCard({ ...chiquimulaSite, cell_resolution_km: 30 });

    expect(
      screen.getByText("Zona de unos 30 km de lado (dato regional, no de su parcela)"),
    ).toBeTruthy();
  });

  test("rounds the cell size to the nearest 10 km, because the text says 'unos'", () => {
    renderCard({ ...chiquimulaSite, cell_resolution_km: 61.7 });

    expect(
      screen.getByText("Zona de unos 60 km de lado (dato regional, no de su parcela)"),
    ).toBeTruthy();
  });
});

describe("SummaryCard top risk", () => {
  test("shows the strong risk with its icon", () => {
    renderCard();

    expect(screen.getByText("⚠ Canícula fuerte")).toBeTruthy();
  });

  test("shows the most severe risk even when it is listed later", () => {
    renderCard({ ...chiquimulaSite, risks: [bareFieldRisk, caniculaRisk] });

    expect(screen.getByText("⚠ Canícula fuerte")).toBeTruthy();
  });

  test("shows no risk line when none is high", () => {
    renderCard({ ...chiquimulaSite, risks: [bareFieldRisk] });

    expect(screen.queryByText(/⚠/)).toBeNull();
  });
});

describe("SummaryCard buttons", () => {
  test("Ver riesgos calls onViewRisks", () => {
    const { onViewRisks } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Ver riesgos" }));

    expect(onViewRisks).toHaveBeenCalledTimes(1);
  });

  test("Ver recomendaciones calls onViewRecommendations", () => {
    const { onViewRecommendations } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "Ver recomendaciones →" }));

    expect(onViewRecommendations).toHaveBeenCalledTimes(1);
  });

  test("O elija un lugar calls onPickPlace", () => {
    const { onPickPlace } = renderCard();

    fireEvent.click(screen.getByRole("button", { name: "O elija un lugar: ›" }));

    expect(onPickPlace).toHaveBeenCalledTimes(1);
  });
});
