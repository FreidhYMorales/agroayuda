import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import type { RecommendationRequest } from "../../contracts/contracts";
import { ComparisonScreen, ComparisonTable } from "./ComparisonScreen";
import { FIXTURE_OPTIONS, withoutRecommended } from "./fixture";

const fetchMock = vi.fn<typeof fetch>();

const REQUEST: RecommendationRequest = {
  location: { lat: 14.7, lon: -89.5 },
  current_rotation: { primera: "maiz", postrera: "frijol" },
  priorities: { water: 5, soil: 3, income: 3, risk: 3 },
  constraints: { irrigation: false },
};

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function handlers() {
  return {
    onBack: vi.fn(),
    onChangePriorities: vi.fn(),
    onInvalidRequest: vi.fn(),
    onOutsideRegion: vi.fn(),
  };
}

function okResponse(options = FIXTURE_OPTIONS) {
  return Response.json({ options });
}

function errorResponse(error: string, status: number) {
  return Response.json({ error, detail: "x" }, { status });
}

function rowOf(label: string): HTMLElement {
  const header = screen.getByRole("rowheader", { name: new RegExp(label) });
  return header.closest("tr") as HTMLElement;
}

test("shows exactly three columns: Actual, Op.1, Op.2", () => {
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={vi.fn()} />);

  const buttons = screen.getAllByRole("button");

  expect(buttons.map((button) => button.textContent)).toEqual(["Actual", "Op.1", "Op.2"]);
  expect(screen.getAllByRole("columnheader")).toHaveLength(4);
});

test("Meses sin cultivo shows 5, 4, 5", () => {
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={vi.fn()} />);

  const cells = within(rowOf("Meses sin cultivo")).getAllByRole("cell");

  expect(cells.map((cell) => cell.textContent)).toEqual(["5", "4", "5"]);
});

test("criteria rows show a bar and its number", () => {
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={vi.fn()} />);

  for (const [label, numbers] of [
    ["Agua", ["3", "4", "4"]],
    ["Suelo", ["3", "4", "3"]],
    ["Ingreso", ["3", "3", "2"]],
    ["Riesgo", ["2", "3", "2"]],
  ] as const) {
    const cells = within(rowOf(label)).getAllByRole("cell");
    expect(cells.map((cell) => cell.textContent)).toEqual(numbers);
    expect(cells[0].querySelector("[aria-hidden='true']")).not.toBeNull();
  }
});

test("badges: current warns, Op.1 recommended, Op.2 not recommended with its reason", () => {
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={vi.fn()} />);

  const headers = screen.getAllByRole("columnheader");

  expect(headers[1]).toHaveTextContent("⚠ Aguanta poco la sequía de la canícula");
  expect(headers[2]).toHaveTextContent("✓ Recomendada");
  expect(headers[3]).toHaveTextContent("✗ No recomendada");
  expect(headers[3]).toHaveTextContent("Aguanta poco la sequía de la canícula");
});

test("confidence shows dots plus a word and highlights the low one", () => {
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={vi.fn()} />);

  const cells = within(rowOf("Confianza")).getAllByRole("cell");

  expect(cells.map((cell) => cell.textContent)).toEqual(["●●○ media", "●●○ media", "●○○ baja"]);
  expect(cells[2]).toHaveAttribute("data-low-confidence", "true");
  expect(cells[0]).not.toHaveAttribute("data-low-confidence");
});

test("orders the current rotation first", () => {
  const shuffled = [FIXTURE_OPTIONS[2], FIXTURE_OPTIONS[0], FIXTURE_OPTIONS[1]];
  render(<ComparisonTable options={shuffled} onSelect={vi.fn()} />);

  const cells = within(rowOf("Meses sin cultivo")).getAllByRole("cell");

  expect(cells.map((cell) => cell.textContent)).toEqual(["5", "5", "4"]);
});

test("tapping a column reports its index", () => {
  const onSelect = vi.fn();
  render(<ComparisonTable options={FIXTURE_OPTIONS} onSelect={onSelect} />);

  fireEvent.click(screen.getByRole("button", { name: "Op.1" }));

  expect(onSelect).toHaveBeenCalledWith(1);
});

test("loads the options, then shows the table and the footer", async () => {
  fetchMock.mockImplementation(async () => okResponse());
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  expect(screen.getByRole("button", { name: "← Sus opciones" })).toBeVisible();
  expect(screen.getByText("Toque una opción ›")).toBeVisible();
  expect(screen.getByText("ⓘ Esto es una ayuda; no reemplaza su criterio")).toBeVisible();
  expect(screen.getByRole("button", { name: "[ Cambiar prioridades ]" })).toBeVisible();
  expect(screen.queryByText(/Su rotación actual ya es la mejor/)).toBeNull();
});

test("shows a skeleton while the request is pending", () => {
  fetchMock.mockReturnValue(new Promise<Response>(vi.fn()));
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  expect(document.querySelectorAll("[data-skeleton-row]").length).toBeGreaterThan(0);
  expect(screen.queryByText("Despertando el servidor…")).toBeNull();
});

test("says 'Despertando el servidor…' after 5 seconds without an answer", async () => {
  vi.useFakeTimers();
  fetchMock.mockReturnValue(new Promise<Response>(vi.fn()));
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  await act(async () => {
    await vi.advanceTimersByTimeAsync(4999);
  });
  expect(screen.queryByText("Despertando el servidor…")).toBeNull();
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1);
  });

  expect(screen.getByText("Despertando el servidor…")).toBeVisible();
});

test("says the current rotation is the best when nothing is recommended", async () => {
  fetchMock.mockImplementation(async () => okResponse(withoutRecommended(FIXTURE_OPTIONS)));
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  expect(
    await screen.findByText(
      "Su rotación actual ya es la mejor para sus prioridades, pero tenga cuidado con la canícula",
    ),
  ).toBeVisible();
});

test("500 shows 'Intentar de nuevo' and a click retries once", async () => {
  fetchMock
    .mockResolvedValueOnce(errorResponse("internal", 500))
    .mockResolvedValueOnce(okResponse());
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  fireEvent.click(await screen.findByRole("button", { name: "Intentar de nuevo" }));

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("a network failure also offers 'Intentar de nuevo'", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  expect(await screen.findByRole("button", { name: "Intentar de nuevo" })).toBeVisible();
});

test("422 and outside_region never offer a retry and call their handlers", async () => {
  const invalid = handlers();
  fetchMock.mockResolvedValueOnce(errorResponse("invalid_request", 422));
  const first = render(<ComparisonScreen request={REQUEST} {...invalid} />);
  await waitFor(() => expect(invalid.onInvalidRequest).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).toBeNull();
  first.unmount();

  const outside = handlers();
  fetchMock.mockResolvedValueOnce(errorResponse("outside_region", 404));
  render(<ComparisonScreen request={REQUEST} {...outside} />);
  await waitFor(() => expect(outside.onOutsideRegion).toHaveBeenCalledTimes(1));
  expect(screen.queryByRole("button", { name: "Intentar de nuevo" })).toBeNull();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("opening Op.1 shows its detail and 'Opción 1' goes back to the table", async () => {
  fetchMock.mockImplementation(async () => okResponse());
  render(<ComparisonScreen request={REQUEST} {...handlers()} />);

  fireEvent.click(await screen.findByRole("button", { name: "Op.1" }));

  expect(screen.getByText("Maíz con frijol → Maicillo")).toBeVisible();
  expect(screen.getByRole("heading", { name: "Evidencia (datos):" })).toBeVisible();
  expect(screen.getByText(/NASA POWER/)).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "← Opción 1" }));
  expect(await screen.findByRole("button", { name: "Op.2" })).toBeVisible();
});

test("'Cambiar prioridades' and '← Sus opciones' call their handlers", async () => {
  fetchMock.mockImplementation(async () => okResponse());
  const props = handlers();
  render(<ComparisonScreen request={REQUEST} {...props} />);

  fireEvent.click(await screen.findByRole("button", { name: "[ Cambiar prioridades ]" }));
  fireEvent.click(screen.getByRole("button", { name: "← Sus opciones" }));

  expect(props.onChangePriorities).toHaveBeenCalledTimes(1);
  expect(props.onBack).toHaveBeenCalledTimes(1);
});

test("the latest request wins when an older answer arrives late", async () => {
  let resolveFirst: (response: Response) => void = () => undefined;
  fetchMock
    .mockReturnValueOnce(
      new Promise<Response>((resolve) => {
        resolveFirst = resolve;
      }),
    )
    .mockImplementationOnce(async () => okResponse());
  const props = handlers();
  const view = render(<ComparisonScreen request={REQUEST} {...props} />);

  const newer: RecommendationRequest = {
    ...REQUEST,
    priorities: { water: 3, soil: 3, income: 5, risk: 3 },
  };
  view.rerender(<ComparisonScreen request={newer} {...props} />);
  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();

  await act(async () => {
    resolveFirst(
      okResponse(
        FIXTURE_OPTIONS.map((option) => ({
          ...option,
          sequence: { primera: "ayote", postrera: "none" } as const,
        })),
      ),
    );
  });

  expect(screen.queryByText(/Ayote/)).toBeNull();
  expect(screen.getAllByText("Maíz → Frijol").length).toBeGreaterThan(0);
});
