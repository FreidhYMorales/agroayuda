import { expect, test } from "vitest";
import { columnBadge, confidenceText, deltaText, summaryMessage } from "./badges";
import { FIXTURE_OPTIONS, withoutRecommended } from "./fixture";

test("better reads mejor", () => {
  expect(deltaText("better")).toBe("▲ mejor");
});

test("worse reads menos and same reads igual", () => {
  expect(deltaText("worse")).toBe("▼ menos");
  expect(deltaText("same")).toBe("= igual");
});

test("current column warns with its reason", () => {
  expect(columnBadge(FIXTURE_OPTIONS[0])).toEqual({
    kind: "warning",
    text: "⚠ Aguanta poco la sequía de la canícula",
  });
});

test("recommended option reads Recomendada", () => {
  expect(columnBadge(FIXTURE_OPTIONS[1])).toEqual({ kind: "recommended", text: "✓ Recomendada" });
});

test("not recommended option shows its reason", () => {
  const badge = columnBadge(FIXTURE_OPTIONS[2]);

  expect(badge.kind).toBe("not_recommended");
  expect(badge.text).toContain("✗ No recomendada");
  expect(badge.text).toContain("Aguanta poco la sequía de la canícula");
});

test("no badge without a reason", () => {
  const plain = { ...FIXTURE_OPTIONS[0], not_recommended_reason: null };

  expect(columnBadge(plain)).toEqual({ kind: "none", text: "" });
});

test("the current column is never marked No recomendada", () => {
  const current = { ...FIXTURE_OPTIONS[0], recommended: true };

  expect(columnBadge(current).kind).toBe("warning");
});

test("no summary while an option is recommended", () => {
  expect(summaryMessage(FIXTURE_OPTIONS)).toBeNull();
});

test("best current rotation, with a warning about the canícula", () => {
  expect(summaryMessage(withoutRecommended(FIXTURE_OPTIONS))).toBe(
    "Su rotación actual ya es la mejor para sus prioridades, pero tenga cuidado con la canícula",
  );
});

test("best current rotation without a warning", () => {
  const options = withoutRecommended(FIXTURE_OPTIONS).map((option) =>
    option.is_current ? { ...option, not_recommended_reason: null } : option,
  );

  expect(summaryMessage(options)).toBe("Su rotación actual ya es la mejor para sus prioridades");
});

test("confidence shows dots and a word", () => {
  expect(confidenceText("high")).toBe("●●● alta");
  expect(confidenceText("medium")).toBe("●●○ media");
  expect(confidenceText("low")).toBe("●○○ baja");
});

test("confidence words in English", () => {
  expect(confidenceText("high", "en")).toBe("●●● high");
  expect(confidenceText("medium", "en")).toBe("●●○ medium");
  expect(confidenceText("low", "en")).toBe("●○○ low");
});
