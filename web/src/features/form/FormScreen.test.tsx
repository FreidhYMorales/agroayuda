import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CATALOG_FIXTURE } from "./catalogFixture";
import { DEFAULT_PRIORITIES, FormScreen, type FormValues } from "./FormScreen";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockImplementation(async () => Response.json(CATALOG_FIXTURE));
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function setup(values: FormValues = { priorities: DEFAULT_PRIORITIES }) {
  const onChange = vi.fn();
  const onSubmit = vi.fn();
  const onBack = vi.fn();
  render(<FormScreen values={values} onChange={onChange} onSubmit={onSubmit} onBack={onBack} />);
  return { onChange, onSubmit, onBack };
}

function block(title: string): HTMLElement {
  const heading = screen.getByRole("heading", { name: title });
  const section = heading.closest("section");
  if (!section) throw new Error(`no section for ${title}`);
  return section;
}

test("shows the three blocks with the exact titles", async () => {
  setup();

  expect(screen.getByRole("button", { name: "← Su parcela" })).toBeInTheDocument();
  expect(await screen.findByRole("heading", { name: "¿Qué siembra en primera?" })).toBeVisible();
  expect(screen.getByRole("heading", { name: "¿Y en postrera?" })).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "¿Qué es lo más importante para usted?" }),
  ).toBeVisible();
  expect(screen.getByRole("button", { name: "Comparar opciones →" })).toBeVisible();
});

test("shows a skeleton while the catalog loads", () => {
  fetchMock.mockReturnValue(new Promise<Response>(vi.fn()));
  setup();

  expect(document.querySelectorAll("[data-skeleton-row]").length).toBeGreaterThan(0);
  expect(screen.queryByRole("button", { name: "Maíz" })).toBeNull();
});

test("filters crops by season: maicillo only in postrera, Nada in postrera", async () => {
  setup();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });

  const primera = block("¿Qué siembra en primera?");
  const postrera = block("¿Y en postrera?");

  expect(within(primera).queryByRole("button", { name: "Maicillo" })).toBeNull();
  expect(within(primera).getByRole("button", { name: "Maíz con frijol" })).toBeVisible();
  expect(within(postrera).getByRole("button", { name: "Maicillo" })).toBeVisible();
  expect(within(postrera).queryByRole("button", { name: "Maíz con frijol" })).toBeNull();
  expect(within(postrera).getByRole("button", { name: "Nada" })).toBeVisible();
  expect(within(primera).getByRole("button", { name: "Nada" })).toBeVisible();
});

test("each crop shows its icon next to its text", async () => {
  setup();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  const primera = block("¿Qué siembra en primera?");

  expect(within(primera).getByRole("button", { name: "Maíz" })).toHaveTextContent("🌽");
});

test("priorities default to 3 and each has five targets of at least 44 px", async () => {
  setup();

  for (const label of ["Ahorrar agua", "Cuidar suelo", "Ganar más", "Menos riesgo"]) {
    const group = screen.getByRole("group", { name: new RegExp(label) });
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(5);
    expect(within(group).getByRole("radio", { name: "3" })).toBeChecked();
    for (const radio of radios) {
      const target = radio.closest("label") as HTMLElement;
      expect(Number.parseInt(target.style.width, 10)).toBeGreaterThanOrEqual(44);
      expect(Number.parseInt(target.style.height, 10)).toBeGreaterThanOrEqual(44);
    }
  }
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
});

test("the label sits above its circles", async () => {
  setup();
  const group = screen.getByRole("group", { name: /Ahorrar agua/ });

  expect(group.firstElementChild?.tagName).toBe("LEGEND");
  expect(group.firstElementChild).toHaveTextContent("💧 Ahorrar agua");
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
});

test("picking a priority reports the whole priorities object", async () => {
  const { onChange } = setup();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });

  const group = screen.getByRole("group", { name: /Ganar más/ });
  fireEvent.click(within(group).getByRole("radio", { name: "5" }));

  expect(onChange).toHaveBeenCalledWith({
    priorities: { water: 3, soil: 3, income: 5, risk: 3 },
  });
});

test("irrigation defaults to No and can be changed", async () => {
  const { onChange } = setup();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  const group = screen.getByRole("group", { name: "¿Tiene riego?" });

  expect(within(group).getByRole("radio", { name: "No" })).toBeChecked();
  fireEvent.click(within(group).getByRole("radio", { name: "Sí" }));

  expect(onChange).toHaveBeenCalledWith({ irrigation: true });
});

test("choosing a crop reports it", async () => {
  const { onChange } = setup();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  const primera = block("¿Qué siembra en primera?");
  fireEvent.click(within(primera).getByRole("button", { name: "Maíz" }));

  expect(onChange).toHaveBeenCalledWith({ primera: "maiz" });
});

test("submit stays off until both crops are chosen; defaults never block it", () => {
  setup();

  expect(screen.getByRole("button", { name: "Comparar opciones →" })).toBeDisabled();
});

test("submit is enabled with both crops, and 'Nada' counts as a choice", () => {
  const onSubmit = vi.fn();
  render(
    <FormScreen
      values={{ primera: "none", postrera: "none", priorities: DEFAULT_PRIORITIES }}
      onChange={vi.fn()}
      onSubmit={onSubmit}
      onBack={vi.fn()}
    />,
  );
  const submit = screen.getByRole("button", { name: "Comparar opciones →" });

  expect(submit).toBeEnabled();
  fireEvent.click(submit);
  expect(onSubmit).toHaveBeenCalledTimes(1);
});

test("the chosen crop is marked without relying on color", async () => {
  render(
    <FormScreen
      values={{ primera: "maiz", priorities: DEFAULT_PRIORITIES }}
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      onBack={vi.fn()}
    />,
  );
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  const chosen = within(block("¿Qué siembra en primera?")).getByRole("button", { name: "Maíz" });

  expect(chosen).toHaveAttribute("aria-pressed", "true");
  expect(chosen).toHaveTextContent("✓");
});

test("back goes to the map step", () => {
  const { onBack } = setup();

  fireEvent.click(screen.getByRole("button", { name: "← Su parcela" }));

  expect(onBack).toHaveBeenCalledTimes(1);
});

test("shows a notice above the form", () => {
  render(
    <FormScreen
      values={{ priorities: DEFAULT_PRIORITIES }}
      notice="Revise sus respuestas"
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      onBack={vi.fn()}
    />,
  );

  expect(screen.getByRole("alert")).toHaveTextContent("Revise sus respuestas");
});

test("a catalog error offers 'Intentar de nuevo' and reloads", async () => {
  fetchMock.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  setup();

  const retry = await screen.findByRole("button", { name: "Intentar de nuevo" });
  fireEvent.click(retry);

  expect(await screen.findByRole("button", { name: "Maicillo" })).toBeVisible();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test("scrolls to the priorities block when asked", async () => {
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  render(
    <FormScreen
      values={{ priorities: DEFAULT_PRIORITIES }}
      focusPriorities
      onChange={vi.fn()}
      onSubmit={vi.fn()}
      onBack={vi.fn()}
    />,
  );

  await waitFor(() => expect(scrollIntoView).toHaveBeenCalled());
  expect(scrollIntoView.mock.contexts[0]).toBe(
    screen.getByRole("heading", { name: "¿Qué es lo más importante para usted?" }),
  );
});
