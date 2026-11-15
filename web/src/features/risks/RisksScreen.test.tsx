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

  // ◐ is missing from common phone fonts and showed as ◖: the badge draws a
  // circle with CSS and only uses glyphs every font has.
  test("each level shows a drawn badge with a plain glyph", () => {
    renderReady([makeRisk(), bareField(), makeRisk({ level: "low" })]);

    const badges = screen.getAllByTestId("level-badge");
    expect(badges.map((badge) => badge.textContent)).toEqual(["⚠", "!", "✓"]);
    expect(badges.map((badge) => badge.dataset.level)).toEqual(["high", "medium", "low"]);
    expect(document.body.textContent).not.toContain("◐");
  });

  test("the badge is a circle whose color differs by level", () => {
    renderReady([makeRisk(), bareField(), makeRisk({ level: "low" })]);

    const badges = screen.getAllByTestId("level-badge");
    for (const badge of badges) {
      expect(badge.style.borderRadius).toBe("50%");
      // Color plus text, never color alone: the badge is decoration.
      expect(badge.getAttribute("aria-hidden")).toBe("true");
    }
    const colors = new Set(badges.map((badge) => badge.style.backgroundColor));
    expect(colors.size).toBe(3);
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

describe("RisksScreen in English", () => {
  afterEach(() => {
    window.history.replaceState(null, "", "/");
  });

  test("the screen and each risk row are in English", () => {
    window.history.replaceState(null, "", "/?step=risks&lang=en");

    renderReady([bareField(), makeRisk({ value: 0.4 })]);

    expect(screen.getByRole("heading", { name: "Risks in this area" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Close" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "See recommendations →" })).toBeTruthy();
    expect(screen.getByText("Strong dry spell (canícula)")).toBeTruthy();
    expect(screen.getByText("mid Jul-Aug")).toBeTruthy();
    expect(screen.getByText("Data: NASA POWER · in 12 of 30 years")).toBeTruthy();
    expect(screen.getByText("Bare field · moderate")).toBeTruthy();
    expect(screen.getByText("Dec-Apr (estimated)")).toBeTruthy();
  });

  test("with no strong risk and on error the messages are in English", () => {
    window.history.replaceState(null, "", "/?step=risks&lang=en");

    renderReady([bareField()]);
    expect(screen.getByText("We found no strong risks in this area")).toBeTruthy();

    cleanup();
    render(
      <RisksScreen
        view={{ status: "error" }}
        onClose={vi.fn()}
        onRetry={vi.fn()}
        onContinue={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();
  });
});

describe("RisksScreen responsive layout (work package 09)", () => {
  test("the screen centers itself with .ag-screen and has no inline max width", () => {
    renderReady([makeRisk()]);

    const root = screen.getByRole("region", { name: "Riesgos de esta zona" });
    expect(root.classList).toContain("ag-screen");
    expect(root.style.maxWidth).toBe("");
  });

  test("the risk list is the grid that becomes two columns on tablets", () => {
    renderReady([makeRisk(), bareField()]);

    expect(screen.getByRole("list").classList).toContain("ag-risk-grid");
  });

  test("Ver recomendaciones is a capped main action on wide screens and stays below the list", () => {
    renderReady([makeRisk(), bareField()]);

    const button = screen.getByRole("button", { name: "Ver recomendaciones →" });
    expect(button.classList).toContain("ag-action");
    expect(
      screen.getByRole("list").compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).not.toBe(0);
  });
});
