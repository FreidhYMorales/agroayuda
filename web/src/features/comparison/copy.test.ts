import { expect, test } from "vitest";
import { comparisonCopy } from "./copy";

test("English comparison texts", () => {
  const copy = comparisonCopy("en");

  expect(copy.back).toBe("← Your options");
  expect(copy.columnTitles).toEqual(["Current", "Opt. 1", "Opt. 2"]);
  expect(copy.criteria).toEqual({ water: "Water", soil: "Soil", income: "Income", risk: "Risk" });
  expect(copy.criterion).toBe("Criterion");
  expect(copy.confidence).toBe("Confidence");
  expect(copy.bareMonths).toBe("Months without a crop");
  expect(copy.recommendedNote("Opt. 1", "Pigeon pea → Nothing")).toBe(
    "✓ Recommended: Opt. 1 (Pigeon pea → Nothing)",
  );
  expect(copy.warningNote("Current", "x")).toBe("⚠ Current: x");
  expect(copy.notRecommendedNote("Opt. 2", "x")).toBe("✗ Opt. 2 not recommended: x");
  expect(copy.tapOption).toBe("Tap an option ›");
  expect(copy.aid).toBe("ⓘ This is an aid; it does not replace your judgment");
  expect(copy.changePriorities).toBe("Change priorities");
});

test("Spanish comparison texts stay as they were", () => {
  const copy = comparisonCopy("es");

  expect(copy.back).toBe("← Sus opciones");
  expect(copy.columnTitles).toEqual(["Actual", "Op.1", "Op.2"]);
  expect(copy.criteria).toEqual({
    water: "Agua",
    soil: "Suelo",
    income: "Ingreso",
    risk: "Riesgo",
  });
  expect(copy.criterion).toBe("Criterio");
  expect(copy.confidence).toBe("Confianza");
  expect(copy.bareMonths).toBe("Meses sin cultivo");
  expect(copy.recommendedNote("Op.1", "Gandul → Nada")).toBe("✓ Recomendada: Op.1 (Gandul → Nada)");
  expect(copy.warningNote("Actual", "x")).toBe("⚠ Actual: x");
  expect(copy.notRecommendedNote("Op.2", "x")).toBe("✗ Op.2 no recomendada: x");
  expect(copy.tapOption).toBe("Toque una opción ›");
  expect(copy.aid).toBe("ⓘ Esto es una ayuda; no reemplaza su criterio");
  expect(copy.changePriorities).toBe("Cambiar prioridades");
});
