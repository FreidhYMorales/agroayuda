// web/src/features/map/LocateButton.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import { LocateButton } from "./LocateButton";

afterEach(cleanup);

const LABEL = "📍 ¿Dónde está su parcela?";

function renderButton(locating = false) {
  const onLocate = vi.fn();
  render(<LocateButton locating={locating} onLocate={onLocate} />);
  return { onLocate, button: screen.getByRole("button", { name: LABEL }) as HTMLButtonElement };
}

describe("LocateButton", () => {
  test("shows the exact label with the pin icon", () => {
    const { button } = renderButton();

    expect(button.textContent).toBe(LABEL);
  });

  test("a click calls onLocate", () => {
    const { onLocate, button } = renderButton();

    fireEvent.click(button);

    expect(onLocate).toHaveBeenCalledTimes(1);
  });

  test("is enabled when idle", () => {
    const { button } = renderButton(false);

    expect(button.disabled).toBe(false);
  });

  test("is disabled while locating, so a second tap does nothing", () => {
    const { onLocate, button } = renderButton(true);

    fireEvent.click(button);

    expect(button.disabled).toBe(true);
    expect(onLocate).not.toHaveBeenCalled();
  });
});
