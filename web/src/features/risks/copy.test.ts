import { expect, test } from "vitest";
import { risksCopy } from "./copy";

test("English risks texts", () => {
  expect(risksCopy("en")).toEqual({
    header: "Risks in this area",
    close: "Close",
    noStrongRisk: "We found no strong risks in this area",
    continue: "See recommendations →",
    retry: "Try again",
  });
});

test("Spanish risks texts stay as they were", () => {
  expect(risksCopy("es")).toEqual({
    header: "Riesgos de esta zona",
    close: "Cerrar",
    noStrongRisk: "No encontramos riesgos fuertes en esta zona",
    continue: "Ver recomendaciones →",
    retry: "Intentar de nuevo",
  });
});
