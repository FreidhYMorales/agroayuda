// web/src/features/form/PriorityInfo.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test } from "vitest";
import { PriorityInfo } from "./PriorityInfo";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

const LABEL = "¿Qué significa cada prioridad?";

test("closed at first: an ⓘ button that says what it opens", () => {
  render(<PriorityInfo />);

  const button = screen.getByRole("button", { name: LABEL });
  expect(button.textContent).toBe("ⓘ");
  expect(button.getAttribute("aria-expanded")).toBe("false");
  expect(screen.queryByRole("region", { name: LABEL })).toBeNull();
});

test("a tap opens a card that explains each priority and how the numbers are used", () => {
  render(<PriorityInfo />);
  const button = screen.getByRole("button", { name: LABEL });

  fireEvent.click(button);

  const card = screen.getByRole("region", { name: LABEL });
  expect(button.getAttribute("aria-expanded")).toBe("true");
  expect(button.getAttribute("aria-controls")).toBe(card.id);
  for (const text of [
    "💧 Ahorrar agua: cultivos que necesitan poca agua.",
    "🟫 Cuidar suelo: cultivos que abonan la tierra y la cubren; dejarla sin cultivo mucho tiempo la daña.",
    "💰 Ganar más: cultivos con mejor venta en el mercado.",
    "🛡 Menos riesgo: cultivos que aguantan la sequía y la canícula.",
    "Toque 5 en lo que más le importa. Con esto ordenamos las opciones.",
  ]) {
    expect(screen.getByText(text)).toBeVisible();
  }
});

test("a second tap, Cerrar or Escape close it; Escape and Cerrar give focus back to ⓘ", () => {
  render(<PriorityInfo />);
  const button = screen.getByRole("button", { name: LABEL });

  fireEvent.click(button);
  fireEvent.click(button);
  expect(screen.queryByRole("region", { name: LABEL })).toBeNull();

  fireEvent.click(button);
  fireEvent.keyDown(screen.getByRole("region", { name: LABEL }), { key: "Escape" });
  expect(screen.queryByRole("region", { name: LABEL })).toBeNull();
  expect(document.activeElement).toBe(button);

  fireEvent.click(button);
  fireEvent.click(screen.getByRole("button", { name: "Cerrar" }));
  expect(screen.queryByRole("region", { name: LABEL })).toBeNull();
  expect(document.activeElement).toBe(button);
});

test("in English", () => {
  window.history.replaceState(null, "", "/?lang=en");
  render(<PriorityInfo />);

  fireEvent.click(screen.getByRole("button", { name: "What does each priority mean?" }));

  expect(screen.getByText("💧 Save water: crops that need little water.")).toBeVisible();
  expect(screen.getByRole("button", { name: "Close" })).toBeVisible();
});

test("the ⓘ is a touch target of at least 44 px", () => {
  render(<PriorityInfo />);
  const button = screen.getByRole("button", { name: LABEL });

  expect(Number.parseInt(button.style.minWidth, 10)).toBeGreaterThanOrEqual(44);
  expect(Number.parseInt(button.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
});
