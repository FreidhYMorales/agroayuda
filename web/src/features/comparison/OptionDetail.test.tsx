import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, expect, onTestFinished, test, vi } from "vitest";
import { FIXTURE_OPTIONS } from "./fixture";
import { bareMonthsText, OptionDetail } from "./OptionDetail";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

function detail(index: number, title: string, onBack = vi.fn()) {
  render(<OptionDetail option={FIXTURE_OPTIONS[index]} title={title} onBack={onBack} />);
  return onBack;
}

function item(text: RegExp): HTMLElement {
  return screen.getByText(text).closest("li") as HTMLElement;
}

test("shows the crops, the comparison lines and the confidence", () => {
  detail(1, "Opción 1");

  expect(screen.getByRole("button", { name: "← Comparación" })).toBeVisible();
  expect(screen.getByText("Maíz con frijol → Maicillo")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Comparada con lo actual:" })).toBeVisible();
  expect(item(/Agua/)).toHaveTextContent("▲ mejor");
  expect(item(/Suelo/)).toHaveTextContent("▲ mejor");
  expect(item(/Ingreso/)).toHaveTextContent("= igual");
  expect(item(/Riesgo/)).toHaveTextContent("▲ mejor");
  expect(screen.getByText("Confianza: ●●○ media")).toBeVisible();
});

test("a worse criterion reads menos", () => {
  detail(2, "Opción 2");

  expect(item(/Ingreso/)).toHaveTextContent("▼ menos");
});

test("one section for each kind of text, with the exact titles", () => {
  detail(1, "Opción 1");

  for (const title of [
    "Por qué:",
    "Evidencia (datos):",
    "Beneficio:",
    "⚠ Consulte con un técnico",
    "❔ Lo que no sabemos:",
  ]) {
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  }
  expect(screen.getByText("Ahorra más agua, que es lo más importante para usted.")).toBeVisible();
  expect(screen.getByText("El frijol en asocio aporta nitrógeno al suelo.")).toBeVisible();
  expect(
    screen.getByText("Consulte con un técnico qué variedad de maicillo conviene."),
  ).toBeVisible();
  expect(screen.getByText("Valor general del maicillo; validar localmente.")).toBeVisible();
});

test("each evidence item names its dataset", () => {
  detail(1, "Opción 1");

  const evidence = screen.getByRole("heading", { name: "Evidencia (datos):" }).closest("section");
  expect(within(evidence as HTMLElement).getByText(/NASA POWER/)).toBeVisible();
  expect(within(evidence as HTMLElement).getByText(/0\.70/)).toBeVisible();
});

test("says crop values are general and must be validated locally", () => {
  detail(1, "Opción 1");

  expect(screen.getByText(/valor general, validar localmente/)).toBeVisible();
});

test("says how many months the field stays bare", () => {
  detail(1, "Opción 1");

  expect(screen.getByText("Deja el terreno sin cultivo 4 meses (estimado)")).toBeVisible();
});

test("the current column has no comparison against itself", () => {
  detail(0, "Actual");

  expect(screen.queryByRole("heading", { name: "Comparada con lo actual:" })).toBeNull();
  expect(screen.getByText("Deja el terreno sin cultivo 5 meses (estimado)")).toBeVisible();
});

test("an option without evidence shows a dash instead of an empty list", () => {
  detail(2, "Opción 2");

  const evidence = screen.getByRole("heading", { name: "Evidencia (datos):" }).closest("section");
  expect(within(evidence as HTMLElement).getByText("—")).toBeVisible();
});

test("back calls the handler", () => {
  const onBack = detail(1, "Opción 1");

  fireEvent.click(screen.getByRole("button", { name: "← Comparación" }));

  expect(onBack).toHaveBeenCalledTimes(1);
});

function inEnglish() {
  window.history.replaceState(null, "", "/?step=results&lang=en");
  onTestFinished(() => window.history.replaceState(null, "", "/"));
}

test("with lang=en the detail's fixed texts are in English", () => {
  inEnglish();
  detail(1, "Opt. 1");

  expect(screen.getByText("Maize with beans → Sorghum")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Compared with current:" })).toBeVisible();
  expect(item(/Water/)).toHaveTextContent("▲ better");
  expect(item(/Soil/)).toHaveTextContent("▲ better");
  expect(item(/Income/)).toHaveTextContent("= same");
  expect(item(/Risk/)).toHaveTextContent("▲ better");
  expect(screen.getByText("Confidence: ●●○ medium")).toBeVisible();
  expect(
    screen.getByText("Leaves the field without a crop for 4 months (estimated)"),
  ).toBeVisible();
  for (const title of [
    "Why:",
    "Evidence (data):",
    "Benefit:",
    "⚠ Talk to a technician",
    "❔ What we do not know:",
  ]) {
    expect(screen.getByRole("heading", { name: title })).toBeVisible();
  }
  expect(screen.getByText("Crop values: general value, check locally.")).toBeVisible();
});

test("with lang=en a worse criterion reads worse", () => {
  inEnglish();
  detail(2, "Opt. 2");

  expect(item(/Income/)).toHaveTextContent("▼ worse");
});

test("bare months in English, singular and none", () => {
  expect(bareMonthsText(0, "en")).toBe("Leaves no month without a crop (estimated)");
  expect(bareMonthsText(1, "en")).toBe("Leaves the field without a crop for 1 month (estimated)");
  expect(bareMonthsText(1)).toBe("Deja el terreno sin cultivo 1 mes (estimado)");
});

test("with lang=en the detail shows the engine's English texts", () => {
  inEnglish();
  detail(1, "Opt. 1");

  expect(screen.getByText("Saves more water, which matters most to you.")).toBeVisible();
  expect(screen.getByText("Beans grown together add nitrogen to the soil.")).toBeVisible();
  expect(screen.getByText("Ask a technician which sorghum variety suits you.")).toBeVisible();
  expect(screen.getByText("General value for sorghum; check locally.")).toBeVisible();
  expect(screen.queryByText("Ahorra más agua, que es lo más importante para usted.")).toBeNull();
});

test("with lang=en the evidence uses its English text and value", () => {
  inEnglish();
  const option = {
    ...FIXTURE_OPTIONS[1],
    evidence: [
      {
        text_es: "Racha seca larga en 21 de 30 años.",
        text_en: "Long dry spell in 21 of 30 years.",
        dataset: "NASA POWER",
        value: "21 de 30 años",
        value_en: "21 of 30 years",
      },
    ],
  };
  render(<OptionDetail option={option} title="Opt. 1" onBack={vi.fn()} />);

  expect(
    screen.getByText("Long dry spell in 21 of 30 years. (NASA POWER: 21 of 30 years)"),
  ).toBeVisible();
});

test("responsive layout: why and evidence in the first column, the rest in the second", () => {
  detail(1, "Opción 1");

  const cols = document.querySelector(".ag-cols");
  expect(cols).not.toBeNull();
  const children = [...(cols as Element).children];
  expect(children).toHaveLength(2);
  const [first, second] = children as HTMLElement[];
  expect(within(first).getByRole("heading", { name: "Por qué:" })).toBeTruthy();
  expect(within(first).getByRole("heading", { name: "Evidencia (datos):" })).toBeTruthy();
  expect(within(second).getByRole("heading", { name: "Beneficio:" })).toBeTruthy();
  expect(within(second).getByRole("heading", { name: "⚠ Consulte con un técnico" })).toBeTruthy();
  expect(within(second).getByRole("heading", { name: "❔ Lo que no sabemos:" })).toBeTruthy();
});

test("the detail still says which option it is, above the sequence", () => {
  detail(1, "Opción 1");

  expect(screen.getByText("Opción 1")).toBeVisible();
  expect(screen.getByRole("button", { name: "← Comparación" })).toBeVisible();
});
