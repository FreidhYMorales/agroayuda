import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { CATALOG_FIXTURE } from "../form/catalogFixture";
import { FIXTURE_OPTIONS } from "./fixture";
import { ResultsFlow } from "./ResultsFlow";

const fetchMock = vi.fn<typeof fetch>();
const PLACE = "lat=14.65&lon=-89.51";

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
  window.history.replaceState(null, "", "/");
});

function openAt(search: string) {
  window.history.replaceState(null, "", `/${search}`);
}

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

function params() {
  return new URLSearchParams(window.location.search);
}

async function chooseAndCompare(primera = "Maíz", postrera = "Frijol") {
  await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" });
  fireEvent.click(cropButton("¿Qué siembra en primera (siembra de mayo)?", primera));
  fireEvent.click(cropButton("¿Y en postrera (siembra de agosto a septiembre)?", postrera));
  fireEvent.click(screen.getByRole("button", { name: "Comparar opciones →" }));
}

test("the answers live in the URL while the form is filled", async () => {
  openAt(`?step=form&${PLACE}`);
  route();
  render(<ResultsFlow />);

  await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" });
  fireEvent.click(cropButton("¿Qué siembra en primera (siembra de mayo)?", "Maíz"));
  fireEvent.click(cropButton("¿Y en postrera (siembra de agosto a septiembre)?", "Frijol"));
  const income = screen.getByRole("group", { name: /Ganar más/ });
  fireEvent.click(within(income).getByRole("radio", { name: "5" }));
  const irrigation = screen.getByRole("group", { name: "¿Tiene riego?" });
  fireEvent.click(within(irrigation).getByRole("radio", { name: "Sí" }));

  expect(params().get("p")).toBe("maiz");
  expect(params().get("s")).toBe("frijol");
  expect(params().get("i")).toBe("5");
  expect(params().get("irr")).toBe("1");
});

test("form -> comparison sends the answers from the URL as the request", async () => {
  openAt(`?step=form&${PLACE}`);
  route();
  render(<ResultsFlow />);

  await chooseAndCompare();

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  expect(params().get("step")).toBe("results");
  const [, init] = recommendationCalls()[0];
  expect(JSON.parse(String(init?.body))).toEqual({
    location: { lat: 14.65, lon: -89.51 },
    current_rotation: { primera: "maiz", postrera: "frijol" },
    priorities: { water: 3, soil: 3, income: 3, risk: 3 },
    constraints: { irrigation: false },
  });
});

test("reloading on the results step shows the comparison again", async () => {
  openAt(`?step=results&${PLACE}&p=maiz&s=frijol&w=5&irr=0`);
  route();
  render(<ResultsFlow />);

  expect(await screen.findByRole("button", { name: "Op.1" })).toBeVisible();
  expect(JSON.parse(String(recommendationCalls()[0][1]?.body)).priorities.water).toBe(5);
});

test("the results step without crops shows the form instead", async () => {
  openAt(`?step=results&${PLACE}`);
  route();
  render(<ResultsFlow />);

  expect(
    await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" }),
  ).toBeVisible();
  expect(recommendationCalls()).toHaveLength(0);
});

test("422 shows the form again, answers kept, with 'Revise sus respuestas'", async () => {
  openAt(`?step=form&${PLACE}`);
  route(() =>
    Response.json(
      { error: "invalid_request", detail: "maicillo is not a primera crop" },
      { status: 422 },
    ),
  );
  render(<ResultsFlow />);

  await chooseAndCompare();

  expect(await screen.findByText("Revise sus respuestas")).toBeVisible();
  await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" });
  expect(params().get("step")).toBe("form");
  expect(cropButton("¿Qué siembra en primera (siembra de mayo)?", "Maíz")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(cropButton("¿Y en postrera (siembra de agosto a septiembre)?", "Frijol")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(screen.getByRole("button", { name: "Comparar opciones →" })).toBeEnabled();
});

test("outside_region goes back to the map step with its message", async () => {
  openAt(`?step=form&${PLACE}`);
  route(() => Response.json({ error: "outside_region", detail: "Point outside" }, { status: 404 }));
  const onBackToMap = vi.fn();
  render(<ResultsFlow onBackToMap={onBackToMap} />);

  await chooseAndCompare();

  await waitFor(() =>
    expect(onBackToMap).toHaveBeenCalledWith("Por ahora solo cubrimos el Corredor Seco"),
  );
  expect(params().get("step")).toBe("map");
});

test("'← Mapa' goes back to the map step without a message", async () => {
  openAt(`?step=form&${PLACE}`);
  route();
  const onBackToMap = vi.fn();
  render(<ResultsFlow onBackToMap={onBackToMap} />);

  fireEvent.click(screen.getByRole("button", { name: "← Mapa" }));

  expect(onBackToMap).toHaveBeenCalledWith();
  expect(params().get("step")).toBe("map");
  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
});

test("submitting without a place on the map goes back to the map", async () => {
  openAt("?step=form&p=maiz&s=frijol");
  route();
  render(<ResultsFlow />);

  await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" });
  fireEvent.click(screen.getByRole("button", { name: "Comparar opciones →" }));

  expect(params().get("step")).toBe("map");
  expect(recommendationCalls()).toHaveLength(0);
});

test("'Cambiar prioridades' shows the form at priorities, answers kept, then recalculates", async () => {
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  openAt(`?step=form&${PLACE}`);
  route();
  render(<ResultsFlow />);
  await chooseAndCompare();

  fireEvent.click(await screen.findByRole("button", { name: "Cambiar prioridades" }));

  const heading = await screen.findByRole("heading", {
    name: "¿Qué es lo más importante para usted?",
  });
  await waitFor(() => expect(scrollIntoView.mock.contexts).toContain(heading));
  expect(params().get("step")).toBe("form");
  await screen.findByRole("heading", { name: "¿Qué siembra en primera (siembra de mayo)?" });
  expect(cropButton("¿Qué siembra en primera (siembra de mayo)?", "Maíz")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(cropButton("¿Y en postrera (siembra de agosto a septiembre)?", "Frijol")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

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

test("with lang=en a 422 shows the form again with 'Check your answers'", async () => {
  openAt(`?step=results&lang=en&${PLACE}&p=maiz&s=frijol&w=5&irr=0`);
  route(() =>
    Response.json(
      { error: "invalid_request", detail: "maicillo is not a primera crop" },
      { status: 422 },
    ),
  );
  render(<ResultsFlow />);

  expect(await screen.findByText("Check your answers")).toBeVisible();
  expect(screen.queryByText("Revise sus respuestas")).toBeNull();
});
