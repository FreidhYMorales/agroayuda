// web/src/features/risks/riskLines.test.ts
import { describe, expect, test } from "vitest";
import type { SiteRisk } from "../../contracts/contracts";
import { riskPeriod, riskSourceLine } from "./riskLines";

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

describe("riskPeriod", () => {
  test("canícula reads mediados plus the abbreviated range", () => {
    expect(riskPeriod(makeRisk())).toBe("mediados jul-ago");
  });

  test("an estimated period that wraps the year reads dic-abr (estimado)", () => {
    const risk = makeRisk({
      id: "bare_field",
      level: "medium",
      period_months: [12, 1, 2, 3, 4],
      estimated: true,
    });

    expect(riskPeriod(risk)).toBe("dic-abr (estimado)");
  });

  test("a period that is not estimated has no suffix", () => {
    const risk = makeRisk({
      id: "bare_field",
      period_months: [12, 1, 2, 3, 4],
    });

    expect(riskPeriod(risk)).toBe("dic-abr");
  });

  test("a single month reads just that month", () => {
    const risk = makeRisk({ id: "heat", period_months: [4] });

    expect(riskPeriod(risk)).toBe("abr");
  });
});

describe("riskSourceLine", () => {
  test("canícula shows the source and the years out of 30", () => {
    expect(riskSourceLine(makeRisk())).toBe("Dato: NASA POWER · en 21 de 30 años");
  });

  test("canícula without a value shows only the source", () => {
    expect(riskSourceLine(makeRisk({ value: null }))).toBe("Dato: NASA POWER");
  });

  test("bare field shows its source as is", () => {
    const risk = makeRisk({
      id: "bare_field",
      value: 5,
      threshold: null,
      source: "Calendario de siembra y catálogo de cultivos",
    });

    expect(riskSourceLine(risk)).toBe("Dato: Calendario de siembra y catálogo de cultivos");
  });

  test("soil-based lines say the sample is near the center of the zone", () => {
    const risk = makeRisk({
      id: "missing_data",
      level: "unknown",
      value: null,
      threshold: null,
      source: "SoilGrids",
    });

    expect(riskSourceLine(risk)).toBe("Dato: SoilGrids · muestra cerca del centro de la zona");
  });
});