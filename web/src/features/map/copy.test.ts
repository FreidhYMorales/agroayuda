import { expect, test } from "vitest";
import { mapCopy } from "./copy";

test("English map texts", () => {
  const copy = mapCopy("en");

  expect(copy.locate).toBe("📍 Use my location");
  expect(copy.empty).toBe("Tap the map or pick a place from the list");
  expect(copy.zoneLine(61.7)).toBe("Area about 60 km across (regional data, not your plot)");
});

test("Spanish map texts stay as they were", () => {
  const copy = mapCopy("es");

  expect(copy.locate).toBe("📍 Usar mi ubicación");
  expect(copy.empty).toBe("Toque el mapa o elija un lugar de la lista");
  expect(copy.zoneLine(61.7)).toBe("Zona de unos 60 km de lado (dato regional, no de su parcela)");
});
