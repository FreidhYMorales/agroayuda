import { expect, test } from "vitest";
import { cropLabel } from "./cropLabels";

test("English crop names", () => {
  expect(cropLabel("maicillo", "en")).toBe("Sorghum");
  expect(cropLabel("gandul", "en")).toBe("Pigeon pea");
  expect(cropLabel("maiz_frijol", "en")).toBe("Maize with beans");
  expect(cropLabel("none", "en")).toBe("Nothing");
});

test("Spanish crop names stay as they were", () => {
  expect(cropLabel("maicillo", "es")).toBe("Maicillo");
  expect(cropLabel("maiz_frijol", "es")).toBe("Maíz con frijol");
  expect(cropLabel("none")).toBe("Nada");
});
