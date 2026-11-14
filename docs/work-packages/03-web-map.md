# Work package 03: Web — map and risks (plus Vercel, video, pitch)

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Owner: ________ · Estimate: 1.4 dev-days (after named cut 1) · Due: H8 (Sat 16:00) first Vercel deploy; H16 (Sun 00:00) thin slice; H31.5 (Sun 15:30) video · Depends on: lead's contracts (H2), examples + generated TS types (H4), static files from package 01, Render URL from package 02

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies outside the allowlist. Only create or edit the files listed under "Files to deliver".
> Keep the signatures. Write the failing test first, then the code (Strict TDD). Tests never call the network.
> UI text is Spanish (Guatemala), usted, copied exactly from this package. If something in the contract seems wrong,
> tell me instead of changing it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026, Challenge 7). You build the first thing judges see: the map with the NASA POWER rain layer, the summary card for the chosen zone, the demo-place list, and the site-risk list. You also own the Vercel project, phone checks, the 30 s video and the live pitch slides, and you are first responder for TypeScript questions (escalate to the lead after 15 min).

## Scope

- In: Vercel project; map + rain layer + region outline + selected cell + summary card + demo-place list + all states; site risks list (named cut 1: one source line on each risk row, no detail screen); app shell + URL state; map-side bug fixing incl. phone end-to-end checks on Vercel previews; video script + English AI voice-over; live pitch slides + rehearsal.
- Out of scope: input form, comparison (package 04); static data files (package 01); `web/src/contracts/` (generated); `web/src/api/client.ts` (lead's typed fetch example). SHOULD: heat/soil chips, municipio search, risk chart, glossary, region mask.

## Milestones (clock time)

| When | You deliver |
|---|---|
| H0-H2 Sat 08:00-10:00 (no repo yet) | Finalize the map/risks copy (below) and the video outline |
| H2 Sat 10:00 | Clone, green `make check`; Vercel project connected |
| H4 Sat 12:00 | Generated types available; switch fixtures to `contracts/examples/` |
| H8 Sat 16:00 | First Vercel deploy: static map with the rain layer |
| H10 Sat 18:00 | Map, card, list, risks green against examples. Lead spot check |
| H16 Sun 00:00 | Thin slice on Vercel: map -> risks -> form -> comparison (Chiquimula). Video script starts |
| H24-H28.5 Sun 08:00-12:30 | SHOULD items; bug fixing on a real phone |
| H28.5 Sun 12:30 | Feature freeze; slides from video screenshots; one rehearsal |
| H31.5 Sun 15:30 | 30 s video recorded with the AI voice-over |

## Contracts (frozen — do not change)

The lead commits the Pydantic models in `contracts/src/` at H2 (Sat 10:00) and examples at H4; TS types are generated into `web/src/contracts/` at H4 (never hand-edit, never hand-copy types into `web/`). Until H4 use this spec and the JSON below as test fixtures; then import the generated types and `contracts/examples/`.

```text
Level = "low"|"medium"|"high"|"unknown"
Location { lat: number, lon: number }; Polygon { type: "Polygon", coordinates: number[][][] }  // [lon, lat]
SiteRisk { id: "canicula"|"bare_field"|"heat"|"missing_data", level, period_months: number[],
           value: number|null, threshold: number|null, unit, source, estimated: boolean, explanation_es }
SiteProfile { location, cell_polygon, cell_resolution_km, climate: { monthly_precip_mm[12],
  monthly_tmax_c[12], dekadal_precip_mm[36] }, soil: { clay_pct, sand_pct, ph, soc_g_kg } (nullable each),
  soil_sample_location: Location|null, risks: SiteRisk[] }
ErrorResponse { error: "outside_region"|"invalid_request"|"not_found"|"internal", detail }  // 404, 422, 404, 500
DemoPoint { id, name_es, location }
RainCellProperties { value_mm (1991-2020 annual normal), unit, source, resolution_km }
Priorities { water, soil, income, risk: 1-5 }; CropId: fixed at H2 (incl. maiz, frijol, maiz_frijol, maicillo, none)
```

Endpoints (lead): `GET /site?lat=&lon=` -> `SiteProfile` or `ErrorResponse`; `GET /health`. Static files (data owner) under `web/public/data/`: `layers/rain.geojson`, `region.geojson`, `demo_points.json`.

Fixture until H4 (placeholder numbers, not real data):

```json
{"location": {"lat": 14.70, "lon": -89.50},
 "cell_polygon": {"type": "Polygon", "coordinates": [[[-89.6875, 14.25], [-89.0625, 14.25], [-89.0625, 14.75], [-89.6875, 14.75], [-89.6875, 14.25]]]},
 "cell_resolution_km": 60,
 "climate": {"monthly_precip_mm": [5,5,10,40,110,190,150,160,190,150,40,10],
   "monthly_tmax_c": [29,30,32,33,32,30,30,30,29,28,28,28],
   "dekadal_precip_mm": [2,2,1,2,2,1,3,3,4,10,15,15,30,40,40,70,60,60,60,40,50,50,50,60,60,70,60,60,50,40,20,10,10,4,3,3]},
 "soil": {"clay_pct": 30.0, "sand_pct": 40.0, "ph": 6.5, "soc_g_kg": 12.0},
 "soil_sample_location": {"lat": 14.5, "lon": -89.375},
 "risks": [
  {"id": "canicula", "level": "high", "period_months": [7, 8], "value": 0.7, "threshold": 0.67,
   "unit": "share of years 1991-2020", "source": "NASA POWER (PRECTOTCORR diario, 1991-2020)", "estimated": false,
   "explanation_es": "Racha seca larga a mediados de julio y agosto. La lluvia de NASA POWER es una estimación regional."},
  {"id": "bare_field", "level": "medium", "period_months": [12, 1, 2, 3, 4], "value": 5, "threshold": null,
   "unit": "meses", "source": "Calendario de siembra y catálogo de cultivos", "estimated": true,
   "explanation_es": "Suelo sin cultivo de diciembre a abril (estimado, con la rotación típica maíz → frijol)."}]}
```

```json
{"error": "outside_region", "detail": "Point outside the Dry Corridor region"}
{"id": "chiquimula", "name_es": "Chiquimula", "location": {"lat": 14.70, "lon": -89.50}}
{"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[-89.6875,14.25],[-89.0625,14.25],[-89.0625,14.75],[-89.6875,14.75],[-89.6875,14.25]]]},
 "properties": {"value_mm": 1200, "unit": "mm/año", "source": "NASA POWER", "resolution_km": 60}}
```

`value`/`unit` semantics are the data owner's proposal (confirm at H2): canícula `value` is a share 0-1; show "en {round(value*30)} de 30 años".

## What to build

**Map screen.** MapLibre with OpenFreeMap tiles (keyless, attribution shown); if tiles fail, fall back to a plain background style that still draws region, cells and selection. Rain layer: one fill per cell from `rain.geojson`, legend "poca lluvia" ... "mucha", source line "Dato: NASA POWER ›" that opens source + resolution ("celdas de unos 60 km"). Region outline drawn above the cells. The tapped point's native cell is highlighted from `SiteProfile.cell_polygon` (not a radius). Buttons: "¿Dónde está su parcela?" with 📍 (browser Geolocation). Latest request wins: abort older `/site` calls (`AbortController`).

**Summary card.** Title = demo place name if picked from the list, else "Su zona" (the contract has no place name). Lines: "Zona de unos 60 km de lado (dato regional, no de su parcela)"; the top risk ("⚠ Canícula fuerte"); buttons "Ver riesgos", "Ver recomendaciones →"; "O elija un lugar: ›" opens the demo-place list (Chiquimula + one outside point; the non-map alternative, MUST).

**Map states (exact copy).** Empty: "Toque el mapa o elija un lugar de la lista". Loading: grey card. Slow API (> 5 s): "Despertando el servidor, un momento…". Error: message + "Intentar de nuevo". `outside_region`: "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea." Geolocation denied: "No pudimos ver su ubicación. Toque el mapa o elija un lugar." Basemap or layer error: "No pudimos cargar el mapa; elija un lugar de la lista".

**Site risks.** Header "Riesgos de esta zona", ✕ to close. Rows sorted by severity (high, medium, low, unknown last), icon + text, never color alone. Title from `id` + `level`: canícula high "Canícula fuerte", medium "Canícula moderada"; bare field "Suelo sin cultivo"; missing data "❔ Suelo: sin dato" (only when soil was fetched and came back null). Period line ("mediados jul-ago", "dic-abr (estimado)" when `estimated`). Named cut 1: one source line per row instead of a detail screen, e.g. "Dato: NASA POWER · en 21 de 30 años"; soil-based lines say "muestra cerca del centro de la zona". No high risk: "No encontramos riesgos fuertes en esta zona". Loading: grey rows. Error: "Intentar de nuevo". Button "Ver recomendaciones →". No NASA logos anywhere; text "Datos: NASA POWER" only.

**App shell and URL state.** The full request lives in the URL query; the form and comparison (package 04) read and write it through your module. Missing point -> map. One top-level error boundary with a retry button.

## Files to deliver

| Path | Purpose |
|---|---|
| `web/src/App.tsx` | Shell: step switch (map, risks, form, results), error boundary |
| `web/src/lib/urlState.ts` (+ test) | URL state (signatures below; package 04 consumes it) |
| `web/src/api/site.ts` (+ test) | `getSite` with abort and slow callback, on top of the lead's client |
| `web/src/features/map/**` | Map, rain layer, legend, card, demo list, states, copy |
| `web/src/features/risks/**` | Risk list, rows, states, copy |
| `web/vercel.json` (only if needed) | Vercel config |
| `docs/video-script.md` | Timed 30 s English script |

Package 04 owns `web/src/features/form/**`, `web/src/features/comparison/**`, `web/src/api/recommendations.ts`. Render `FormScreen` and `ComparisonScreen` from their files once they land (placeholder `<div>` until then).

## Skeletons (spec; keep the signatures)

```ts
// web/src/lib/urlState.ts
export type Step = "map" | "risks" | "form" | "results";
export interface AppState {
  step: Step; lat?: number; lon?: number; place?: string;            // place = DemoPoint.id
  primera?: CropId; postrera?: CropId; priorities: Priorities; irrigation?: boolean;
}
export function readState(search: string): AppState;     // defaults: step "map", priorities 3/3/3/3
export function toSearch(state: AppState): string;        // keys: step, lat, lon, place, p, s, w, so, i, r, irr
export function toRequest(state: AppState): RecommendationRequest | null; // null when point or crops missing
export function useAppState(): [AppState, (patch: Partial<AppState>) => void]; // pushes history

// web/src/api/site.ts
export type SiteResult = { ok: true; site: SiteProfile } | { ok: false; error: ErrorResponse["error"] | "network" };
export function getSite(lat: number, lon: number, opts: { signal: AbortSignal; onSlow: () => void }): Promise<SiteResult>;

// web/src/features/risks/riskTitle.ts
export function riskTitle(risk: SiteRisk): string;        // "Canícula fuerte", ...
export function sortRisks(risks: SiteRisk[]): SiteRisk[];
```

## Tests (vitest + Testing Library; mock `maplibre-gl` and `fetch`)

Run: `npm --prefix web run test` then `make check`.

| Case | Given / When | Then |
|---|---|---|
| URL round trip | state {step "results", lat 14.7, lon -89.5, p "maiz", s "frijol", w 5}, `toSearch` then `readState` | same state; missing priorities default to 3 |
| Request | state without `postrera` | `toRequest` returns null |
| Latest wins | two `getSite` calls, first slower | only the second result is shown; first aborted |
| Slow | `/site` not answered in 5 s (fake timers) | "Despertando el servidor, un momento…" |
| Outside | `/site` -> 404 `outside_region` | "Por ahora solo cubrimos el Corredor Seco. Toque dentro de la línea." |
| Network error | fetch rejects | "Intentar de nuevo" button; click retries |
| Card | fixture site picked from list "Chiquimula" | card shows "Chiquimula", "Zona de unos 60 km de lado (dato regional, no de su parcela)", "⚠ Canícula fuerte" |
| Empty | no point | "Toque el mapa o elija un lugar de la lista" |
| Geolocation denied | geolocation error callback | "No pudimos ver su ubicación. Toque el mapa o elija un lugar." |
| Map error | map `error` event | "No pudimos cargar el mapa; elija un lugar de la lista" and the list is visible |
| Risk order | risks missing_data, canicula high, bare_field medium | rows: canícula, suelo sin cultivo, suelo sin dato |
| Estimated | bare_field `estimated` true | row text contains "estimado" |
| No strong risk | all risks low | "No encontramos riesgos fuertes en esta zona" |

```ts
// web/src/features/risks/riskTitle.test.ts
import { expect, test } from "vitest";
import { riskTitle } from "./riskTitle";
test("high canícula reads fuerte", () => {
  expect(riskTitle({ id: "canicula", level: "high" } as never)).toBe("Canícula fuerte");
});
```

## Vercel, phone checks, video, pitch

- Vercel: import the GitHub repo, root directory `web`, framework Vite, Node 24; `VITE_API_URL` = the Render URL from the engine owner, set for Production, Preview and Development; Deployment Protection off for previews so teammates' phones can open them.
- Phone checks: on each preview, at ~360 px, run Chiquimula -> risks -> form -> comparison and the outside point; compare `data_version` in `/health` and the static files. Fix map-side bugs.
- Video (30 s max, English; over 30 s is not eligible): timed script from H16 in `docs/video-script.md` on the guide outline: 0-2 s intro (plain text title card), 2-5 challenge, 5-10 name, 10-20 map -> risks -> comparison -> change priorities, 20-30 v2 in one sentence. Say "dato regional". English AI voice-over; acknowledge AI audio in the video description and metadata. No NASA logos; no AI images without a visible watermark; no media of anyone under 18. The web-results owner makes the screen recording; you add the voice-over (cut rule: one take, no editing). Public or unlisted YouTube, not "made for kids".
- Live pitch: 3-4 slides from the video screenshots after the H28.5 freeze, one team rehearsal.

## Setup (Windows 11, PowerShell)

Before Sat 08:00, on a throwaway repo with no challenge content:

```powershell
winget install Git.Git astral-sh.uv Schniz.fnm ezwinports.make
# close and reopen PowerShell, then once:
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
Add-Content $PROFILE 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
# reopen PowerShell; if scripts are blocked:
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

At H2: `git clone <repo-url>`, `cd <repo-folder>`, `Copy-Item .env.example .env`, `uv sync`, `fnm install`, `npm --prefix web ci`, `make check`. Run the app: `npm --prefix web run dev` (http://localhost:5173). Troubleshooting: `node` missing or wrong version -> the `fnm` line is missing from `$PROFILE`, add it, reopen, `fnm install`; `make` not found -> `winget install ezwinports.make`; format check fails on untouched files -> `git add --renormalize .` then `git checkout -- .`.

## Conventions

- Stack: TypeScript, Node 24, npm; React + Vite, MapLibre GL JS, Recharts; Python 3.13 for data/engine/api (not yours).
- Folders: `contracts/` (lead only), `data/`, `engine/`, `api/` (lead only), `web/` (`web/src/contracts/` generated), `docs/`.
- Naming: TS `camelCase` functions, components `PascalCase.tsx`; JSON fields `snake_case`. Code English; UI copy Spanish (Guatemala), usted, short plain sentences; icon plus text, never color alone; touch targets >= 44 px; phone width (~360 px) first.
- Commands: `npm --prefix web run format`, `npm --prefix web run lint`, `npm --prefix web run typecheck`, `npm --prefix web run test`. Done = `make check` green.
- Strict TDD; tests never call the network (mock `fetch`, use fixtures/`contracts/examples/`).
- No new dependencies (allowed: react, vite, maplibre-gl, recharts, vitest, Testing Library, biome). Never edit `contracts/`, `api/`, `web/src/contracts/` or others' files; never weaken checks; no secrets.

## How to deliver

```powershell
git switch main; git pull
git switch -c map/rain-layer
make check
git add web/src/features/map web/src/App.tsx
git commit -m "feat(web): show rain layer and summary card"
git push -u origin map/rain-layer
```

Open the PR on github.com; check the Vercel preview on your phone. Conventional commits with module scope; no AI attribution or `Co-Authored-By` lines. Self-merge (squash) your own green PRs in your files; ubuntu CI from H2, branch protection (0 approvals) from H8. PR description, 3 lines: done, not done, surprises.

## Done when

- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Only your files changed; no contract or dependency changes
- [ ] Map -> risks works on a real phone on the Vercel preview, incl. outside point and slow server
- [ ] Video <= 30 s, English, AI audio acknowledged; slides ready; one rehearsal done

## SHOULD items you may pull after H24 (in order)

SHOULD 0: region mask (dimmed outside area from `region_mask.geojson`, with data). SHOULD 1: risk chart (dekadal series, Recharts) inside the canícula row. SHOULD 4: heat and soil layer chips (with data). SHOULD 5: municipio search.

## Working with your browser AI

- Create a Claude.ai Project (or ChatGPT Project); add this file as project knowledge. After H4 add the generated `web/src/contracts/*.ts`, `contracts/examples/*.json` and the lead's `web/src/api/client.ts`.
- Ask for one component at a time, test first; ask it to mock `maplibre-gl` in tests (jsdom cannot draw maps).
- Paste UI copy from this file; never let the AI rephrase it. Paste `tsc`/biome errors verbatim.

## Lead notes

Updated Sat 2026-11-14 09:20. The lead adds new notes at the top of this section; `git pull` to get them.

### New (Sat 11:25): the API answers now

Until the data pipeline writes `data/output/sites.parquet`, the API serves a dev fixture: only the Chiquimula cell (tap 14.70, -89.50), everything else is `outside_region`, and `/health` says `"data_version": "dev-fixture"`. `/recommendations` returns the example options. Run it with `uv run fastapi dev api/src/api/main.py` and open http://localhost:8000/docs. When real data lands, the API switches to it by itself.

### New (Sat 10:30): resources list

The submission form asks for every external resource (data, documents, libraries, images, fonts, tools), even open source. When you add one, add its row to `docs/resources.md` in the same PR. Rows marked _verify_ need you to confirm the licence on the provider's page.

### New (Sat 10:15): SI disclosure

Space Apps requires stating where and how AI was used for code and data. Fill your row in `docs/si-usage.md` (which AI tool you use and for what) in one of your PRs; that file and the README section are what judges see.

### What already exists in `main`

- Repo: https://github.com/FreidhYMorales/agroayuda (public). Accept the collaborator invite first, or `git push` fails.
- `make check` is green. CI runs it on every PR; `main` only accepts PRs with a green `check`.
- Contracts are frozen: models in `contracts/src/contracts/models.py`, fixtures in `contracts/examples/`, TS types in `web/src/contracts/contracts.ts` (generated, do not edit).
- `CropId` is final: `maiz`, `frijol`, `maiz_frijol`, `maicillo`, `gandul`, `mucuna`, `canavalia`, `ajonjoli`, `ayote`, `none` (changed Sat 10:40: `gandul` and `mucuna` replace `maiz_maicillo` and `caupi`, which had no Guatemalan source).
- Typed examples to copy: `data/src/data_pipeline/parquet_io.py` (Parquet with DuckDB), `api/src/api/repository.py` (DuckDB query), `web/src/api/client.ts` (fetch wrapper).
- The API only has `/health` for now; `/site` and `/recommendations` are the lead's next task (L4). Until then, work against `contracts/examples/` and mocked `fetch`.
- The crop values in `contracts/examples/crop_catalog.json` and the templates in `rotation_templates.json` are fake ("EXAMPLE FIXTURE"). Real values go in `data/catalog/*.csv`, always with a source.

### Branches

One short branch per task, named `map/<task>` (e.g. `map/rain-layer`). Merge it with "Squash and merge", delete it, `git switch main; git pull`, and start the next task on a new branch. Never keep working on a branch after it was merged. Commit messages stay `type(web): ...`.

### Gotchas found while bootstrapping

- Python test file names must be unique across the whole repo (pytest default import mode): use `data/tests/test_grid.py`, not a second `test_smoke.py`. If pytest says "import file mismatch", rename your file.
- Do not add `__init__.py` to any `tests/` folder.
- Lint and format for web is Biome (`npm --prefix web run lint`, `npm --prefix web run format`), not ESLint or Prettier.
- Ruff line length is 100; `make fmt` fixes formatting.

### Notes for you (web map)

- Build `getSite` on top of the lead's client:

  ```ts
  import { requestJson } from "./client";
  import type { SiteProfile } from "../contracts/contracts";

  const result = await requestJson<SiteProfile>(`/site?lat=${lat}&lon=${lon}`, { signal, onSlow });
  // result.ok ? result.data : result.error  -> map it to your SiteResult
  ```

- `requestJson` rethrows aborts on purpose: wrap the call and ignore the error when `isAbortError(e)` is true (latest request wins).
- `web/src/api/client.test.ts` shows how to mock `fetch` and use fake timers for the 5 s "slow" state.
- `App.tsx` and `App.test.tsx` are yours; the current heading is a placeholder, change both freely.
- `maplibre-gl` and `recharts` are installed. Types come from `../contracts/contracts`.
- Vercel: root directory `web`, Node 24, `VITE_API_URL` = the Render URL (the engine owner sends it).
