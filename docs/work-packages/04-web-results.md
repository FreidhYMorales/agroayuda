# Work package 04: Web — input and comparison (plus templates, README, project page)

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Owner: ________ · Estimate: 1.5 dev-days (after named cut 2) · Due: H0-H2 `rotation_templates.csv`; H16 (Sun 00:00) thin slice; H24 (Sun 08:00) full; H35 (Sun 19:00) submitted · Depends on: lead's contracts (H2), examples + generated TS types (H4), `crops.csv` from package 02, `urlState.ts` and `App.tsx` from package 03

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies outside the allowlist. Only create or edit the files listed under "Files to deliver".
> Keep the signatures. Write the failing test first, then the code (Strict TDD). Tests never call the network.
> UI text is Spanish (Guatemala), usted, copied exactly from this package. If something in the contract seems wrong,
> tell me instead of changing it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026, Challenge 7). After picking a zone on the map, the farmer fills one form (current primera/postrera crops, priorities, irrigation) and sees a comparison of the current rotation against two alternatives, with why, evidence, benefits, gaps and what to check with a technician. You build that form and comparison, the curated rotation templates, the judge README, the uptime pinger and the submission (you are the project page's single editor).

## Scope

- In: `rotation_templates.csv` (H0-H2) + season-valid test; one-page input form; comparison table + plain-list detail + three per-column states + "Cambiar prioridades"; error states; copy in usted; results-side bug fixing; uptime pinger (external HTTP monitor); minimal judge README (named cut 2: setup, sources, licences); project page; screen recording for the video.
- Out of scope: map, risks, App shell, URL state module (package 03); scoring (engine); `crops.csv` (engine); `web/src/contracts/` (generated); glossary is SHOULD 2.

## Milestones (clock time)

| When | You deliver |
|---|---|
| H0-H2 Sat 08:00-10:00 (no repo yet) | `rotation_templates.csv` from the lead's curated list, every row sourced |
| Sat after 09:00 | First project page save: name, summary, repo link, members |
| H2 Sat 10:00 | Clone, green `make check`; PR with the CSV + its test |
| H4 Sat 12:00 | Generated types; fixtures from `contracts/examples/` |
| H10 Sat 18:00 | Form + table green against examples. Lead spot check |
| H16 Sun 00:00 | Thin slice: form -> comparison table deployed |
| H24 Sun 08:00 | Plain-list detail, "Cambiar prioridades", all states |
| H28.5-H31.5 Sun 12:30-15:30 | Freeze; screen recording; project page fields drafted in `docs/submission.md` |
| H35 Sun 19:00 | Final save; demo and final-project links checked in incognito on a phone; pinger on |

## Contracts (frozen — do not change)

The lead commits the Pydantic models in `contracts/src/` at H2 (Sat 10:00) and examples at H4; TS types are generated into `web/src/contracts/` at H4 (never hand-edit or hand-copy them). Until H4 use this spec and the JSON below as fixtures.

```text
CropId = fixed at H2 (cap ~10-12); always "maiz", "frijol", "maiz_frijol", "maicillo", "none"
Confidence = "low"|"medium"|"high"; Tier = "low"|"medium"|"high"; scores are int 1-5
Priorities { water: 1-5, soil: 1-5, income: 1-5, risk: 1-5 } (default 3 each)
RecommendationRequest { location: { lat, lon }, current_rotation: { primera: CropId, postrera: CropId },
                        priorities, constraints: { irrigation: boolean } }  // "none" = empty season
Criteria { water, soil, income, risk: 1-5 }; Delta = "better"|"same"|"worse"
Evidence { text_es, dataset, value }
RotationOption { sequence: { primera, postrera }, is_current, recommended, not_recommended_reason: string|null,
  bare_months: number[], criteria, delta_vs_current: { water, soil, income, risk: Delta }, confidence,
  reasons: string[], evidence: Evidence[], benefits: string[], data_gaps: string[], local_review: string[] }
RecommendationResponse { site: SiteProfile, options: RotationOption[] }   // exactly 3: current + 2
ErrorResponse { error: "outside_region"|"invalid_request"|"not_found"|"internal", detail }  // 404, 422, 404, 500
CropCatalogEntry { id: CropId, name_es, icon (emoji, always with its text label), seasons: ("primera"|"postrera")[],
  cycle_days, water_need: Tier, n_fixing, root_depth, erosion_cover: Tier, drought_tolerance: Tier,
  market_tier: Tier, local_source: boolean, source }
RotationTemplate { id, primera: CropId, postrera: CropId, description_es, source }
```

Endpoint (lead): `POST /recommendations` with `RecommendationRequest` -> `RecommendationResponse` or `ErrorResponse`. Static: `web/public/data/crops.json` (list of `CropCatalogEntry`).

From package 03 (`web/src/lib/urlState.ts`, owned by web-map): `AppState { step, lat?, lon?, place?, primera?, postrera?, priorities, irrigation? }`, `useAppState(): [AppState, (patch) => void]`, `toRequest(state): RecommendationRequest | null`. Until it lands, keep state in a local `useState` with the same shape.

Fixture until H4 (illustrative values, not engine output; `site` is omitted because your screens only read `options`; from H4 use the full example in `contracts/examples/`):

```json
{"options": [
 {"sequence": {"primera": "maiz", "postrera": "frijol"}, "is_current": true, "recommended": false,
  "not_recommended_reason": "Aguanta poco la sequía de la canícula", "bare_months": [12, 1, 2, 3, 4],
  "criteria": {"water": 3, "soil": 3, "income": 3, "risk": 2},
  "delta_vs_current": {"water": "same", "soil": "same", "income": "same", "risk": "same"}, "confidence": "medium",
  "reasons": ["Es lo que usted siembra ahora."], "evidence": [{"text_es": "Canícula fuerte en 21 de 30 años", "dataset": "NASA POWER", "value": "0.70"}],
  "benefits": ["Cultivos que usted ya conoce."], "data_gaps": ["La lluvia de NASA POWER es una estimación regional."],
  "local_review": ["Consulte con un técnico si su variedad de maíz aguanta la canícula."]},
 {"sequence": {"primera": "maiz_frijol", "postrera": "maicillo"}, "is_current": false, "recommended": true,
  "not_recommended_reason": null, "bare_months": [1, 2, 3, 4],
  "criteria": {"water": 4, "soil": 4, "income": 3, "risk": 3},
  "delta_vs_current": {"water": "better", "soil": "better", "income": "same", "risk": "better"}, "confidence": "medium",
  "reasons": ["Ahorra más agua, que es lo más importante para usted."], "evidence": [{"text_es": "Canícula fuerte en 21 de 30 años", "dataset": "NASA POWER", "value": "0.70"}],
  "benefits": ["El frijol en asocio aporta nitrógeno al suelo."], "data_gaps": ["Valor general del maicillo; validar localmente."],
  "local_review": ["Consulte con un técnico qué variedad de maicillo conviene."]},
 {"sequence": {"primera": "frijol", "postrera": "maicillo"}, "is_current": false, "recommended": false,
  "not_recommended_reason": "Aguanta poco la sequía de la canícula", "bare_months": [1, 2, 3, 4, 8],
  "criteria": {"water": 4, "soil": 3, "income": 2, "risk": 2},
  "delta_vs_current": {"water": "better", "soil": "same", "income": "worse", "risk": "same"}, "confidence": "low",
  "reasons": ["Ahorra agua."], "evidence": [], "benefits": ["Menos riego."], "data_gaps": ["Valores de cultivo generales (FAO)."],
  "local_review": ["Consulte con un técnico."]}]}
```

```json
{"error": "invalid_request", "detail": "maicillo is not a primera crop"}
```

## What to build

**`rotation_templates.csv` (H0-H2).** Columns `id,primera,postrera,description_es,source`, from the lead's curated list, every row sourced (ICTA/MAGA guides first). Season-valid by construction: each crop is allowed in its slot by `crops.csv` `seasons`. Unique (primera, postrera) pairs; enough rows that every season-valid current rotation (incl. none/none) still leaves 2 other templates. Row order is the tie-break order.

**Form (one scrolling page, three blocks).** "← Su parcela". Block 1 "¿Qué siembra en primera?" icon grid (incl. maíz con frijol); block 2 "¿Y en postrera?" icon grid + "Nada"; crops filtered by season from `crops.json`; icon always with its text label. Block 3 "¿Qué es lo más importante para usted?": 💧 "Ahorrar agua", 🟫 "Cuidar suelo", 💰 "Ganar más", 🛡 "Menos riesgo"; five circles 1-5 each, label above the circles, targets >= 44 px, default 3. "¿Tiene riego? (Sí) (No)". Button "Comparar opciones →". Both seasons "Nada" is allowed. Answers live in the URL. States: catalog loading -> skeleton; catalog error -> "Intentar de nuevo"; defaults never block submission.

**Comparison ("← Sus opciones").** Always exactly 3 columns: "Actual", "Op.1", "Op.2". Rows: 💧Agua, 🟫Suelo, 💰Ingreso, 🛡Riesgo (bars plus number, never color alone), "Confianza" (●●● alta, ●●○ media, ●○○ baja; low confidence highlighted in its column), "Meses sin cultivo" (count from `bare_months`). Per-column states: ✓ "Recomendada" if `recommended`; ✗ "No recomendada" + reason if an alternative has `not_recommended_reason`; ⚠ + reason on the current column; otherwise no badge. No recommended option: "Su rotación actual ya es la mejor para sus prioridades" (add ", pero tenga cuidado con la canícula" when the current column has ⚠). Footer: "Toque una opción ›", "ⓘ Esto es una ayuda; no reemplaza su criterio", "[ Cambiar prioridades ]" (scrolls the form to the priorities block with the current answers kept, then recomputes).

**Detail (tap a column; plain list).** "← Opción 1"; crops ("Maíz con frijol → Maicillo"); "Comparada con lo actual:" one line per criterion with ▲ mejor / ▼ menos / = igual; "Confianza: ●●○ media"; then one line each: "Por qué:", "Evidencia (datos):" (dataset named per item), "Beneficio:", "⚠ Consulte con un técnico", "❔ Lo que no sabemos:". Crop values say "valor general, validar localmente". State how many months the option leaves the field bare.

**Request states (exact copy).** Loading: table skeleton. Slow API (> 5 s): "Despertando el servidor…". 5xx or network: "Intentar de nuevo" (retry only these). 422 `invalid_request`: back to the form with valid answers kept and "Revise sus respuestas". `outside_region`: back to the map with "Por ahora solo cubrimos el Corredor Seco". Results are keyed by the full request (latest request wins).

## Files to deliver

| Path | Purpose |
|---|---|
| `data/catalog/rotation_templates.csv` | Curated templates |
| `data/tests/test_rotation_templates.py` | Season-valid, unique pairs, ids in `CropId` |
| `web/src/features/form/**` (`FormScreen.tsx` + tests) | Input form |
| `web/src/features/comparison/**` (`ComparisonScreen.tsx`, `OptionDetail.tsx` + tests) | Table, detail, states |
| `web/src/api/recommendations.ts` (+ test) | `postRecommendations` with slow callback |
| `README.md` (repo root) | Judge README: setup, sources, licences |
| `docs/submission.md` | Project page fields, drafted then pasted once |

Ship `FormScreen.tsx` and `ComparisonScreen.tsx` as stubs in your first web PR (by H4) so the web-map owner can wire them in `App.tsx`.

## Skeletons (spec; keep the signatures)

```ts
// web/src/api/recommendations.ts
export type RecResult = { ok: true; data: RecommendationResponse }
  | { ok: false; error: ErrorResponse["error"] | "network" };
export function postRecommendations(req: RecommendationRequest,
  opts: { signal: AbortSignal; onSlow: () => void }): Promise<RecResult>;

// web/src/features/comparison/badges.ts
export type Badge = { kind: "recommended" | "not_recommended" | "warning" | "none"; text: string };
export function columnBadge(option: RotationOption): Badge;
export function summaryMessage(options: RotationOption[]): string | null; // "Su rotación actual ya es la mejor ..."
export function deltaText(d: Delta): string;                              // "▲ mejor" | "▼ menos" | "= igual"
```

```python
# data/tests/test_rotation_templates.py  (stdlib csv only)
def test_every_template_is_season_valid() -> None: ...
def test_template_pairs_are_unique() -> None: ...
```

## Tests

Run: `npm --prefix web run test`, `uv run pytest data/tests/test_rotation_templates.py`, then `make check`.

| Case | Given / When | Then |
|---|---|---|
| Season-valid | each template row vs `crops.csv` seasons | every primera crop allows "primera", every postrera crop allows "postrera" |
| Unique | template pairs | no duplicate (primera, postrera) |
| Form defaults | open form with no priorities in URL | four selectors on 3; submit enabled once crops are chosen |
| Season filter | `crops.json` with maicillo seasons ["postrera"] | maicillo absent from the primera grid; "Nada" present in postrera |
| Badges | fixture options | current "⚠ Aguanta poco la sequía de la canícula"; Op.1 "✓ Recomendada"; Op.2 "✗ No recomendada" + reason |
| Best current | no option `recommended`, current has a reason | "Su rotación actual ya es la mejor para sus prioridades, pero tenga cuidado con la canícula" |
| Columns | fixture | exactly 3 columns; "Meses sin cultivo" shows 5, 4, 5 |
| Detail | tap Op.1 | list shows "▲ mejor" for Agua and "Evidencia (datos)" with "NASA POWER" |
| 422 | `/recommendations` -> 422 | form shown, answers kept, "Revise sus respuestas" |
| Outside | -> 404 `outside_region` | map step, "Por ahora solo cubrimos el Corredor Seco" |
| 5xx | -> 500 | "Intentar de nuevo"; click retries once |
| Slow | no answer in 5 s (fake timers) | "Despertando el servidor…" |
| Cambiar prioridades | click it | form visible, priorities block in view, previous answers kept |

```ts
// web/src/features/comparison/badges.test.ts
import { expect, test } from "vitest";
import { deltaText } from "./badges";
test("better reads mejor", () => { expect(deltaText("better")).toBe("▲ mejor"); });
```

## Pinger, README, project page, recording

- Pinger: an external HTTP monitor (free uptime service, not a GitHub Actions cron) hitting the Render `/health` URL every 5-10 min; on by H35.
- README (named cut 2, minimal): what it is, public links, setup (pointer to `docs/development.md`), data sources with attributions and licences (NASA POWER, SoilGrids CC BY 4.0, geoBoundaries, OpenFreeMap/OpenStreetMap, FAO ECOCROP, ICTA/MAGA), the SI disclosure sentence below, and that a pre-event plan exists.
- Project page (single editor; the lead edits only if you are unreachable by H35). First save Sat after 09:00 (name, summary, repo link, members); resave at H35; last save counts. Draft all required fields in English in `docs/submission.md` first: summary, description, SI-use disclosure, NASA data used, references with attributions, demo link (video), final project link. SI sentence (verbatim): "Before the event, we used an AI assistant to organize our ideas into a written plan and to review it, probed the NASA POWER and SoilGrids APIs, and looked at NASA POWER monthly rain normals at one Chiquimula point; no code or datasets from before the event are part of the build." Add: AI as a coding assistant during the event and the English AI voice-over (also in the video metadata). Before the final save, open the demo and final-project links in an incognito window on a phone (YouTube public or unlisted, not "made for kids"). No NASA logos.
- Screen recording (H28.5-H31.5): phone-width recording of demo steps: Chiquimula -> risks -> maíz -> maicillo, water first (5/3/3/3), no irrigation -> comparison -> open the recommended option (gandul) -> "Cambiar prioridades" to income first (1/1/5/1) -> maíz -> frijol is recommended. Hand it to the web-map owner for the voice-over.

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

At H2: `git clone <repo-url>`, `cd <repo-folder>`, `Copy-Item .env.example .env`, `uv sync`, `fnm install`, `npm --prefix web ci`, `make check`. Run the app: `npm --prefix web run dev`. Troubleshooting: `node` missing -> add the `fnm` line to `$PROFILE`, reopen, `fnm install`; `make` not found -> `winget install ezwinports.make`; format check fails on untouched files -> `git add --renormalize .` then `git checkout -- .`.

## Conventions

- Stack: TypeScript, Node 24, npm; React + Vite, MapLibre GL JS, Recharts; Python 3.13 (uv) for data/engine/api.
- Folders: `contracts/` (lead only), `data/`, `engine/` (scoring lives only here), `api/` (lead only), `web/` (`web/src/contracts/` generated), `docs/`.
- Naming: TS `camelCase`, components `PascalCase.tsx`, JSON `snake_case`. Code English; UI copy Spanish (Guatemala), usted, short plain sentences, no jargon on the first level; icon plus text, never color alone; targets >= 44 px; phone width first.
- Commands: `npm --prefix web run format`, `lint`, `typecheck`, `test`; `uv run pytest`. Done = `make check` green.
- Strict TDD; tests never call the network (mock `fetch`; fixtures). No scoring logic in `web/`.
- No new dependencies (allowed: react, vite, maplibre-gl, recharts, vitest, Testing Library, biome; stdlib in Python tests). Never edit `contracts/`, `api/`, `web/src/contracts/` or others' files; never weaken checks; no secrets.

## How to deliver

```powershell
git switch main; git pull
git switch -c results/comparison
make check
git add web/src/features/comparison
git commit -m "feat(web): show comparison table with badges"
git push -u origin results/comparison
```

Open the PR on github.com; check the Vercel preview on your phone. Conventional commits with module scope (`feat(data): add rotation templates`); no AI attribution or `Co-Authored-By` lines. Self-merge (squash) your own green PRs in your files; ubuntu CI from H2, branch protection (0 approvals) from H8. PR description, 3 lines: done, not done, surprises.

## Done when

- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Only your files changed; no contract or dependency changes
- [ ] Form -> comparison -> detail -> "Cambiar prioridades" works on a phone (Vercel preview)
- [ ] Project page saved with every required field; links checked in incognito; pinger on

## SHOULD items you may pull after H24

SHOULD 2: glossary ("¿Qué significa esto? ›", static Spanish copy in `web/`). Then ask the lead for the next unassigned item.

## Working with your browser AI

- Create a Claude.ai Project (or ChatGPT Project); add this file as project knowledge. After H4 add the generated `web/src/contracts/*.ts`, `contracts/examples/*.json`, `web/src/lib/urlState.ts` and the lead's `web/src/api/client.ts`.
- Ask for one component at a time, test first. Paste UI copy from this file; never let the AI rephrase it.
- For the project page, paste the official field list and this file's facts; check every claim against the app.

## Lead notes

Updated Sat 2026-11-14 09:20. The lead adds new notes at the top of this section; `git pull` to get them.

### New (Sat 12:15): the uptime pinger is done

The lead set up an UptimeRobot monitor on `https://agroayuda-api.onrender.com/health` every 5 minutes, so the free Render API stays awake and the lead gets an email if it goes down. Skip the pinger task in your milestones.

### New (Sat 11:45): the app is online

- Web: https://agroayuda.vercel.app (every merge to `main` deploys; every PR gets its own Vercel preview link in the PR page).
- API: https://agroayuda-api.onrender.com (try `/health` and `/docs`). It is free and sleeps when idle: the first call can take about a minute, which is the "Despertando el servidor…" state your screens show.
- Until real data lands the API serves the dev fixture (only Chiquimula).

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

One short branch per task, named `results/<task>` (e.g. `results/form`). Merge it with "Squash and merge", delete it, `git switch main; git pull`, and start the next task on a new branch. Never keep working on a branch after it was merged. Commit messages stay `type(web): ...`.

### Gotchas found while bootstrapping

- Python test file names must be unique across the whole repo (pytest default import mode): use `data/tests/test_grid.py`, not a second `test_smoke.py`. If pytest says "import file mismatch", rename your file.
- Do not add `__init__.py` to any `tests/` folder.
- Lint and format for web is Biome (`npm --prefix web run lint`, `npm --prefix web run format`), not ESLint or Prettier.
- Ruff line length is 100; `make fmt` fixes formatting.

### Notes for you (web results)

- Build `postRecommendations` on top of the lead's client:

  ```ts
  import { requestJson } from "./client";
  import type { RecommendationRequest, RecommendationResponse } from "../contracts/contracts";

  const result = await requestJson<RecommendationResponse>("/recommendations", {
    method: "POST", body: req, signal, onSlow,
  });
  ```

- `requestJson` rethrows aborts on purpose; ignore the error when `isAbortError(e)` is true.
- Fixtures for your screens: `contracts/examples/recommendation_response.json` and the four `error_response_*.json`.
- `rotation_templates.csv` columns = `RotationTemplate` fields; every crop id must be in `CropId` and valid for its season in `crops.csv` (engine owner): agree on seasons early.
- `README.md` at the root is a placeholder from the lead; it is yours to turn into the judge README (keep the links to the docs).
- Ship `FormScreen.tsx` and `ComparisonScreen.tsx` stubs early (by H4) so the web-map owner can wire them in `App.tsx`.
