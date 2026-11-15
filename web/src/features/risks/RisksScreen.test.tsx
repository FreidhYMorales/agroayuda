// web/src/features/risks/RisksScreen.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import type { SiteRisk } from "../../contracts/contracts";
import { buttonStyle } from "../../ui/buttonStyles";

import { expectButtonLook } from "../../ui/expectButtonLook";
import { RisksScreen } from "./RisksScreen";
import { nullSoilSite } from "../map/siteFixture";

afterEach(cleanup);

const makeRisk = (overrides: Partial<SiteRisk> = {}): SiteRisk => ({
  id: "canicula",
  level: "high",
  period_months: [7, 8],
  value: 0.7,
  threshold: 0.67,
  unit: "share of years 1991-2020",
  source: "NASA POWER (PRECTOTCORR diario, 1991-2020)",
  estimated: false,
  explanation_es: "x",
  ...overrides,
});

const bareField = (overrides: Partial<SiteRisk> = {}) =>
  makeRisk({
    id: "bare_field",
    level: "medium",
    period_months: [12, 1, 2, 3, 4],
    value: 5,
    threshold: null,
    unit: "meses",
    source: "Calendario de siembra y catálogo de cultivos",
    estimated: true,
    ...overrides,
  });

const missingData = () =>
  makeRisk({
    id: "missing_data",
    level: "unknown",
    period_months: [],
    value: null,
    threshold: null,
    source: "SoilGrids",
  });

function renderReady(risks: SiteRisk[]) {
  const handlers = { onClose: vi.fn(), onRetry: vi.fn(), onContinue: vi.fn() };
  render(<RisksScreen view={{ status: "ready", risks }} {...handlers} />);
  return handlers;
}

describe("RisksScreen ready", () => {
  test("shows the header", () => {
    renderReady([makeRisk()]);

    expect(screen.getByText("Riesgos de esta zona")).toBeTruthy();
  });

  test("orders rows by severity, unknown last", () => {
    renderReady([missingData(), makeRisk(), bareField()]);

    const rows = screen.getAllByRole("listitem");

    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Canícula fuerte");
    expect(rows[1].textContent).toContain("Suelo sin cultivo");
    expect(rows[2].textContent).toContain("Suelo: sin dato");
  });

  test("an estimated risk says estimado", () => {
    renderReady([bareField({ estimated: true })]);

    expect(screen.getByRole("listitem").textContent).toContain("estimado");
  });

  test("a row has an icon and not only a color", () => {
    renderReady([makeRisk()]);

    expect(screen.getByRole("listitem").textContent).toContain("⚠");
  });

  test("the missing data row does not repeat the ❔ icon", () => {
    renderReady([missingData()]);

    const text = screen.getByRole("listitem").textContent ?? "";

    expect(text.split("❔")).toHaveLength(2); // exactly one
  });

  test("each row shows its period and source line", () => {
    renderReady([makeRisk()]);

    expect(screen.getByText("mediados jul-ago")).toBeTruthy();
    expect(screen.getByText("Dato: NASA POWER · en 21 de 30 años")).toBeTruthy();
  });

  test("says there is no strong risk when all risks are low", () => {
    renderReady([makeRisk({ level: "low" }), bareField({ level: "low" })]);

    expect(screen.getByText("No encontramos riesgos fuertes en esta zona")).toBeTruthy();
  });

  test("says there is no strong risk when the worst is medium, and still lists it", () => {
    renderReady([bareField()]);

    expect(screen.getByText("No encontramos riesgos fuertes en esta zona")).toBeTruthy();
    expect(screen.getAllByRole("listitem")).toHaveLength(1);
  });

  test("does not say there is no strong risk when one is high", () => {
    renderReady([makeRisk(), bareField()]);

    expect(screen.queryByText("No encontramos riesgos fuertes en esta zona")).toBeNull();
  });

  test("the continue button calls onContinue", () => {
    const { onContinue } = renderReady([makeRisk()]);

    fireEvent.click(screen.getByRole("button", { name: "Ver recomendaciones →" }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  test("the ✕ calls onClose", () => {
    const { onClose } = renderReady([makeRisk()]);

    fireEvent.click(screen.getByText("✕"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("RisksScreen loading and error", () => {
  test("loading shows grey rows, not the retry button", () => {
    render(
      <RisksScreen
        view={{ status: "loading" }}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    expect(screen.getAllByTestId("risk-skeleton").length).toBeGreaterThan(0);
    expect(screen.queryByText("Intentar de nuevo")).toBeNull();
  });

  test("loading can still be closed", () => {
    const onClose = vi.fn();
    render(
      <RisksScreen
        view={{ status: "loading" }}
        onClose={onClose}
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByText("✕"));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("error shows Intentar de nuevo and the click retries", () => {
    const onRetry = vi.fn();
    render(
      <RisksScreen
        view={{ status: "error" }}
        onClose={vi.fn()}
        onRetry={onRetry}
        onContinue={vi.fn()}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Intentar de nuevo" }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});

describe("RisksScreen with the null soil example", () => {
  test("lists canícula, suelo sin cultivo and suelo sin dato in that order", () => {
    renderReady(nullSoilSite.risks);

    const rows = screen.getAllByRole("listitem");

    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toContain("Canícula fuerte");
    expect(rows[1].textContent).toContain("Suelo sin cultivo");
    expect(rows[2].textContent).toContain("Suelo: sin dato");
  });

  test("the missing data row names its source without the parenthesis", () => {
    renderReady(nullSoilSite.risks);

    expect(screen.getByText("Dato: SoilGrids · muestra cerca del centro de la zona")).toBeTruthy();
  });
});

describe("RisksScreen button looks", () => {
  test("Ver recomendaciones is the full-width main action", () => {
    renderReady([makeRisk()]);

    expectButtonLook(
      screen.getByRole("button", { name: "Ver recomendaciones →" }),
      buttonStyle("primary", { fullWidth: true }),
    );
  });
});
