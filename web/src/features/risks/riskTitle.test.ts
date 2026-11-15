// web/src/features/risks/riskTitle.test.ts
import { describe, expect, test } from "vitest";
import { riskTitle, sortRisks } from "./riskTitle";

// Solo importan `id` y `level`; el resto del SiteRisk no interviene aquí.
const risk = (id: string, level: string) => ({ id, level }) as never;

test("high canícula reads fuerte", () => {
  expect(riskTitle({ id: "canicula", level: "high" } as never)).toBe("Canícula fuerte");
});

describe("riskTitle", () => {
  test("medium canícula reads moderada", () => {
    expect(riskTitle(risk("canicula", "medium"))).toBe("Canícula moderada");
  });

  test("bare field reads suelo sin cultivo", () => {
    expect(riskTitle(risk("bare_field", "medium"))).toBe("Suelo sin cultivo");
  });

  test("missing data reads suelo sin dato", () => {
    expect(riskTitle(risk("missing_data", "unknown"))).toBe("❔ Suelo: sin dato");
  });

  // Copy no definido en el paquete: se usa el título base, sin adjetivo.
  test("low and unknown canícula fall back to the base title", () => {
    expect(riskTitle(risk("canicula", "low"))).toBe("Canícula");
    expect(riskTitle(risk("canicula", "unknown"))).toBe("Canícula");
  });

  test("heat falls back to the base title", () => {
    expect(riskTitle(risk("heat", "high"))).toBe("Calor");
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
