import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import { FIXTURE_OPTIONS } from "./fixture";
import { OptionDetail } from "./OptionDetail";

function detail(index: number, title: string, onBack = vi.fn()) {
  render(<OptionDetail option={FIXTURE_OPTIONS[index]} title={title} onBack={onBack} />);
  return onBack;
}

function item(text: RegExp): HTMLElement {
  return screen.getByText(text).closest("li") as HTMLElement;
}

test("shows the crops, the comparison lines and the confidence", () => {
  detail(1, "Opción 1");

  expect(screen.getByRole("button", { name: "← Opción 1" })).toBeVisible();
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

  fireEvent.click(screen.getByRole("button", { name: "← Opción 1" }));

  expect(onBack).toHaveBeenCalledTimes(1);
});
