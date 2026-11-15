// web/src/features/risks/riskTitle.test.ts
import { describe, expect, test } from "vitest";
import { riskTitle, sortRisks } from "./riskTitle";

// Only `id` and `level` matter; the rest of SiteRisk plays no part here.
const risk = (id: string, level: string) => ({ id, level }) as never;

test("high canícula reads fuerte", () => {
  expect(riskTitle({ id: "canicula", level: "high" } as never)).toBe("Canícula fuerte");
});

describe("riskTitle", () => {
  test("medium canícula reads moderada", () => {
    expect(riskTitle(risk("canicula", "medium"))).toBe("Canícula moderada");
  });

  // The level must be readable as text, not only from the badge color.
  test("bare field names its level", () => {
    expect(riskTitle(risk("bare_field", "high"))).toBe("Suelo sin cultivo · alto");
    expect(riskTitle(risk("bare_field", "medium"))).toBe("Suelo sin cultivo · moderado");
    expect(riskTitle(risk("bare_field", "low"))).toBe("Suelo sin cultivo · bajo");
    expect(riskTitle(risk("bare_field", "unknown"))).toBe("Suelo sin cultivo");
  });

  test("missing data reads suelo sin dato", () => {
    expect(riskTitle(risk("missing_data", "unknown"))).toBe("❔ Suelo: sin dato");
  });

  // "Canícula baja" comes from the map wireframe in docs/spec.md.
  test("low canícula reads baja", () => {
    expect(riskTitle(risk("canicula", "low"))).toBe("Canícula baja");
  });

  test("unknown canícula falls back to the base title", () => {
    expect(riskTitle(risk("canicula", "unknown"))).toBe("Canícula");
  });

  // "Calor moderado" comes from the risks wireframe in docs/spec.md.
  test("heat names its level", () => {
    expect(riskTitle(risk("heat", "high"))).toBe("Calor fuerte");
    expect(riskTitle(risk("heat", "medium"))).toBe("Calor moderado");
    expect(riskTitle(risk("heat", "low"))).toBe("Calor bajo");
  });

  test("unknown heat falls back to the base title", () => {
    expect(riskTitle(risk("heat", "unknown"))).toBe("Calor");
  });
});

describe("sortRisks", () => {
  test("orders by severity: high, medium, low, unknown last", () => {
    const sorted = sortRisks([
      risk("missing_data", "unknown"),
      risk("canicula", "high"),
      risk("bare_field", "medium"),
    ]);

    expect(sorted.map((r) => r.id)).toEqual(["canicula", "bare_field", "missing_data"]);
  });

  test("puts low before unknown", () => {
    const sorted = sortRisks([risk("heat", "unknown"), risk("bare_field", "low")]);

    expect(sorted.map((r) => r.id)).toEqual(["bare_field", "heat"]);
  });

  test("keeps the original order between equal levels", () => {
    const sorted = sortRisks([risk("heat", "medium"), risk("bare_field", "medium")]);

    expect(sorted.map((r) => r.id)).toEqual(["heat", "bare_field"]);
  });

  test("does not mutate the input array", () => {
    const input = [risk("missing_data", "unknown"), risk("canicula", "high")];
    const copy = [...input];

    sortRisks(input);

    expect(input).toEqual(copy);
  });
});

describe("riskTitle in English", () => {
  test("canícula keeps the local word and names its level", () => {
    expect(riskTitle(risk("canicula", "high"), "en")).toBe("Strong dry spell (canícula)");
    expect(riskTitle(risk("canicula", "medium"), "en")).toBe("Moderate dry spell (canícula)");
    expect(riskTitle(risk("canicula", "low"), "en")).toBe("Mild dry spell (canícula)");
    expect(riskTitle(risk("canicula", "unknown"), "en")).toBe("Dry spell (canícula)");
  });

  test("bare field, heat and missing data", () => {
    expect(riskTitle(risk("bare_field", "high"), "en")).toBe("Bare field · high");
    expect(riskTitle(risk("bare_field", "medium"), "en")).toBe("Bare field · moderate");
    expect(riskTitle(risk("bare_field", "unknown"), "en")).toBe("Bare field");
    expect(riskTitle(risk("heat", "high"), "en")).toBe("Strong heat");
    expect(riskTitle(risk("heat", "low"), "en")).toBe("Mild heat");
    expect(riskTitle(risk("missing_data", "unknown"), "en")).toBe("❔ Soil: no data");
  });
});
