import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CATALOG_FIXTURE } from "../form/catalogFixture";
import { FIXTURE_OPTIONS } from "./fixture";
import { buildRequest, ResultsFlow } from "./ResultsFlow";

const fetchMock = vi.fn<typeof fetch>();
const LOCATION = { lat: 14.7, lon: -89.5 };

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

/** crops.json always answers; /recommendations answers with what each test queues. */
function route(...recommendations: Array<() => Response>) {
  const queue = [...recommendations];
  fetchMock.mockImplementation(async (input) => {
    if (String(input).endsWith("/data/crops.json")) return Response.json(CATALOG_FIXTURE);
    const next = queue.shift() ?? queue[0];
    return next ? next() : Response.json({ options: FIXTURE_OPTIONS });
  });
}

/** Frijol exists in both grids, so look inside one block. */
function cropButton(blockTitle: string, name: string): HTMLElement {
  const section = screen.getByRole("heading", { name: blockTitle }).closest("section");
  return within(section as HTMLElement).getByRole("button", { name });
}

function recommendationCalls() {
  return fetchMock.mock.calls.filter(([url]) => String(url).endsWith("/recommendations"));
}

async function chooseAndCompare(primera = "Maíz", postrera = "Frijol") {
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  fireEvent.click(cropButton("¿Qué siembra en primera?", primera));
  fireEvent.click(cropButton("¿Y en postrera?", postrera));
  fireEvent.click(screen.getByRole("button", { name: "Comparar opciones →" }));
}

test("buildRequest needs both crops and sends irrigation as a boolean", () => {
  const priorities = { water: 5, soil: 3, income: 3, risk: 3 };

  expect(buildRequest({ priorities }, LOCATION)).toBeNull();
  expect(
    buildRequest({ primera: "maiz", postrera: "frijol", priorities, irrigation: true }, LOCATION),
  ).toEqual({
    location: LOCATION,
    current_rotation: { primera: "maiz", postrera: "frijol" },
    priorities,
    constraints: { irrigation: true },
  });
  expect(
    buildRequest({ primera: "none", postrera: "none", priorities }, LOCATION)?.constraints,
  ).toEqual({ irrigation: false });
});

test("form -> comparison sends the answers as the request", async () => {
  route();
  render(<ResultsFlow location={LOCATION} onBackToMap={vi.fn()} />);

  await chooseAndCompare();

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  const [, init] = recommendationCalls()[0];
  expect(JSON.parse(String(init?.body))).toEqual({
    location: LOCATION,
    current_rotation: { primera: "maiz", postrera: "frijol" },
    priorities: { water: 3, soil: 3, income: 3, risk: 3 },
    constraints: { irrigation: false },
  });
});

test("422 shows the form again, answers kept, with 'Revise sus respuestas'", async () => {
  route(() =>
    Response.json(
      { error: "invalid_request", detail: "maicillo is not a primera crop" },
      { status: 422 },
    ),
  );
  render(<ResultsFlow location={LOCATION} onBackToMap={vi.fn()} />);

  await chooseAndCompare();

  expect(await screen.findByText("Revise sus respuestas")).toBeVisible();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  expect(cropButton("¿Qué siembra en primera?", "Maíz")).toHaveAttribute("aria-pressed", "true");
  expect(cropButton("¿Y en postrera?", "Frijol")).toHaveAttribute("aria-pressed", "true");
  expect(screen.getByRole("button", { name: "Comparar opciones →" })).toBeEnabled();
});

test("outside_region goes back to the map with its message", async () => {
  route(() => Response.json({ error: "outside_region", detail: "Point outside" }, { status: 404 }));
  const onBackToMap = vi.fn();
  render(<ResultsFlow location={LOCATION} onBackToMap={onBackToMap} />);

  await chooseAndCompare();

  await waitFor(() =>
    expect(onBackToMap).toHaveBeenCalledWith("Por ahora solo cubrimos el Corredor Seco"),
  );
});

test("'← Su parcela' goes back to the map without a message", async () => {
  route();
  const onBackToMap = vi.fn();
  render(<ResultsFlow location={LOCATION} onBackToMap={onBackToMap} />);

  fireEvent.click(screen.getByRole("button", { name: "← Su parcela" }));

  expect(onBackToMap).toHaveBeenCalledWith();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
});

test("'Cambiar prioridades' shows the form at priorities, answers kept, then recalculates", async () => {
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  route();
  render(<ResultsFlow location={LOCATION} onBackToMap={vi.fn()} />);
  await chooseAndCompare();

  fireEvent.click(await screen.findByRole("button", { name: "[ Cambiar prioridades ]" }));

  const heading = await screen.findByRole("heading", {
    name: "¿Qué es lo más importante para usted?",
  });
  await waitFor(() => expect(scrollIntoView.mock.contexts).toContain(heading));
  await screen.findByRole("heading", { name: "¿Qué siembra en primera?" });
  expect(cropButton("¿Qué siembra en primera?", "Maíz")).toHaveAttribute("aria-pressed", "true");
  expect(cropButton("¿Y en postrera?", "Frijol")).toHaveAttribute("aria-pressed", "true");

  const income = screen.getByRole("group", { name: /Ganar más/ });
  fireEvent.click(within(income).getByRole("radio", { name: "5" }));
  fireEvent.click(screen.getByRole("button", { name: "Comparar opciones →" }));

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  expect(recommendationCalls()).toHaveLength(2);
  expect(JSON.parse(String(recommendationCalls()[1][1]?.body)).priorities).toEqual({
    water: 3,
    soil: 3,
    income: 5,
    risk: 3,
  });
});
