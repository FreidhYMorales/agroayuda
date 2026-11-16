import { expect, test } from "vitest";
import { risksCopy } from "./copy";

test("English risks texts", () => {
  expect(risksCopy("en")).toEqual({
    header: "Risks in this area",
    headerAt: expect.any(Function),
    back: "← Your plot",
    noStrongRisk: "We found no strong risks in this area",
    continue: "See recommendations →",
    retry: "Try again",
  });
});

test("Spanish risks texts", () => {
  expect(risksCopy("es")).toEqual({
    header: "Riesgos de esta zona",
    headerAt: expect.any(Function),
    back: "← Su parcela",
    noStrongRisk: "No encontramos riesgos fuertes en esta zona",
    continue: "Ver recomendaciones →",
    retry: "Intentar de nuevo",
  });
});

test("the header names the place when there is one", () => {
  expect(risksCopy("es").headerAt("Chiquimula")).toBe("Riesgos en Chiquimula");
  expect(risksCopy("en").headerAt("Chiquimula")).toBe("Risks in Chiquimula");
});
