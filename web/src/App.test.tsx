import { render, screen } from "@testing-library/react";
import { App } from "./App";

test("shows the map prompt", () => {
  render(<App />);

  expect(screen.getByRole("heading", { name: "¿Dónde está su parcela?" })).toBeInTheDocument();
});
