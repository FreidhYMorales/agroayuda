import { expect, test } from "vitest";
import { formCopy } from "./copy";

test("English form texts", () => {
  const copy = formCopy("en");

  expect(copy.back).toBe("← Map");
  expect(copy.primeraTitle).toBe("What do you plant in the first season (primera)?");
  expect(copy.postreraTitle).toBe("And in the second season (postrera)?");
  expect(copy.prioritiesTitle).toBe("What matters most to you?");
  expect(copy.priorities).toEqual({
    water: "Save water",
    soil: "Care for the soil",
    income: "Earn more",
    risk: "Less risk",
  });
  expect(copy.irrigationTitle).toBe("Do you have irrigation?");
  expect([copy.yes, copy.no]).toEqual(["Yes", "No"]);
  expect(copy.submit).toBe("Compare options →");
  expect(copy.catalogError).toBe("We could not load the crops.");
  expect(copy.retry).toBe("Try again");
  expect(copy.loading).toBe("Loading the crops…");
});

test("Spanish form texts stay as they were", () => {
  const copy = formCopy("es");

  expect(copy.back).toBe("← Mapa");
  expect(copy.primeraTitle).toBe("¿Qué siembra en primera?");
  expect(copy.postreraTitle).toBe("¿Y en postrera?");
  expect(copy.prioritiesTitle).toBe("¿Qué es lo más importante para usted?");
  expect(copy.priorities).toEqual({
    water: "Ahorrar agua",
    soil: "Cuidar suelo",
    income: "Ganar más",
    risk: "Menos riesgo",
  });
  expect(copy.irrigationTitle).toBe("¿Tiene riego?");
  expect([copy.yes, copy.no]).toEqual(["Sí", "No"]);
  expect(copy.submit).toBe("Comparar opciones →");
  expect(copy.catalogError).toBe("No pudimos cargar los cultivos.");
  expect(copy.retry).toBe("Intentar de nuevo");
  expect(copy.loading).toBe("Cargando los cultivos…");
});
