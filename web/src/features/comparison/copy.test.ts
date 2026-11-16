import { expect, test } from "vitest";
import { comparisonCopy } from "./copy";

test("English comparison texts", () => {
  const copy = comparisonCopy("en");

  expect(copy.back).toBe("← Your crops");
  expect(copy.backToComparison).toBe("← Comparison");
  expect(copy.columnTitles).toEqual(["Current", "Opt. 1", "Opt. 2"]);
  expect(copy.criteria).toEqual({
    water: "Save water",
    soil: "Care for the soil",
    income: "Earn more",
    risk: "Less risk",
  });
  expect(copy.scaleNote).toBe("Score from 1 to 5: 5 is best");
  expect(copy.criterion).toBe("Criterion");
  expect(copy.confidence).toBe("Confidence");
  expect(copy.bareMonths).toBe("Months without a crop (fewer is better)");
  expect(copy.recommendedNote("Opt. 1", "Pigeon pea → Nothing")).toBe(
    "✓ Recommended: Opt. 1 (Pigeon pea → Nothing)",
  );
  expect(copy.warningNote("Current", "x")).toBe("⚠ Current: x");
  expect(copy.notRecommendedNote("Opt. 2", "x")).toBe("✗ Opt. 2 not recommended: x");
  expect(copy.tapOption).toBe("👆 Tap an option to see why");
  expect(copy.aid).toBe("ⓘ This is an aid; it does not replace your judgment");
  expect(copy.changePriorities).toBe("Change priorities");
});

test("Spanish comparison texts", () => {
  const copy = comparisonCopy("es");

  expect(copy.back).toBe("← Sus cultivos");
  expect(copy.backToComparison).toBe("← Comparación");
  expect(copy.columnTitles).toEqual(["Actual", "Op.1", "Op.2"]);
  expect(copy.criteria).toEqual({
    water: "Ahorrar agua",
    soil: "Cuidar suelo",
    income: "Ganar más",
    risk: "Menos riesgo",
  });
  expect(copy.scaleNote).toBe("Puntaje de 1 a 5: 5 es lo mejor");
  expect(copy.criterion).toBe("Criterio");
  expect(copy.confidence).toBe("Confianza");
  expect(copy.bareMonths).toBe("Meses sin cultivo (menos es mejor)");
  expect(copy.recommendedNote("Op.1", "Gandul → Nada")).toBe("✓ Recomendada: Op.1 (Gandul → Nada)");
  expect(copy.warningNote("Actual", "x")).toBe("⚠ Actual: x");
  expect(copy.notRecommendedNote("Op.2", "x")).toBe("✗ Op.2 no recomendada: x");
  expect(copy.tapOption).toBe("👆 Toque una opción para ver por qué");
  expect(copy.aid).toBe("ⓘ Esto es una ayuda; no reemplaza su criterio");
  expect(copy.changePriorities).toBe("Cambiar prioridades");
});
