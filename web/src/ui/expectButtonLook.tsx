// web/src/ui/expectButtonLook.tsx
// Test helper: checks that a rendered button has the look of a variant.
import { render } from "@testing-library/react";
import type { CSSProperties } from "react";
import { expect } from "vitest";

const LOOK_PROPERTIES = [
  "backgroundColor",
  "color",
  "borderTopStyle",
  "borderTopColor",
  "width",
] as const;

// Renders a probe with the expected style so both sides are normalized the
// same way by jsdom (colors, shorthands, numbers to px).
export function expectButtonLook(element: HTMLElement, expected: CSSProperties): void {
  const { container, unmount } = render(<button type="button" style={expected} />);
  const probe = (container.firstChild as HTMLElement).style;

  for (const property of LOOK_PROPERTIES) {
    expect(element.style[property], property).toBe(probe[property]);
  }
  unmount();
}
