// web/src/features/map/SheetHandle.test.tsx
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { SheetHandle } from "./SheetHandle";

// English is the app default; these tests check the Spanish texts, so they start in Spanish.
beforeEach(() => window.history.replaceState(null, "", "/?lang=es"));

afterEach(() => {
  cleanup();
  window.history.replaceState(null, "", "/");
});

function renderHandle(expanded: boolean) {
  const onChange = vi.fn();
  render(<SheetHandle expanded={expanded} controls="sheet" onChange={onChange} />);
  return { onChange, handle: screen.getByRole("button") };
}

test("collapsed: a 'Mostrar más' button that expands the sheet on tap", () => {
  const { onChange, handle } = renderHandle(false);

  expect(handle.getAttribute("aria-label")).toBe("Mostrar más");
  expect(handle.getAttribute("aria-expanded")).toBe("false");
  expect(handle.getAttribute("aria-controls")).toBe("sheet");
  fireEvent.click(handle);
  expect(onChange).toHaveBeenCalledWith(true);
});

test("expanded: a 'Mostrar menos' button that collapses the sheet on tap", () => {
  const { onChange, handle } = renderHandle(true);

  expect(handle.getAttribute("aria-label")).toBe("Mostrar menos");
  expect(handle.getAttribute("aria-expanded")).toBe("true");
  fireEvent.click(handle);
  expect(onChange).toHaveBeenCalledWith(false);
});

test("a swipe up expands once: the click that follows the swipe is ignored", () => {
  const { onChange, handle } = renderHandle(false);

  fireEvent.pointerDown(handle, { clientY: 300 });
  fireEvent.pointerUp(handle, { clientY: 240 });
  fireEvent.click(handle);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(true);
});

test("a swipe down collapses an expanded sheet", () => {
  const { onChange, handle } = renderHandle(true);

  fireEvent.pointerDown(handle, { clientY: 200 });
  fireEvent.pointerUp(handle, { clientY: 280 });
  fireEvent.click(handle);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(false);
});

test("a small finger wobble is a tap, not a swipe", () => {
  const { onChange, handle } = renderHandle(false);

  fireEvent.pointerDown(handle, { clientY: 300 });
  fireEvent.pointerUp(handle, { clientY: 290 });
  fireEvent.click(handle);

  expect(onChange).toHaveBeenCalledTimes(1);
  expect(onChange).toHaveBeenCalledWith(true);
});

test("labels follow lang=en", () => {
  window.history.replaceState(null, "", "/?lang=en");
  const { handle } = renderHandle(false);

  expect(handle.getAttribute("aria-label")).toBe("Show more");
});

test("is a touch target of at least 44 px that does not scroll the page while swiping", () => {
  const { handle } = renderHandle(false);

  expect(Number.parseInt(handle.style.minHeight, 10)).toBeGreaterThanOrEqual(44);
  expect(handle.style.touchAction).toBe("none");
  expect(handle.classList).toContain("ag-map-handle");
});

test("leaves display to the CSS, so the side layout can hide it", () => {
  const { handle } = renderHandle(false);

  expect(handle.style.display).toBe("");
});
