# Work package 02: Engine (crop catalog, calendar, scoring, selection, Render)

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Owner: ________ · Estimate: 1.47 dev-days · Due: H16 (Sun 00:00) thin slice; H24 (Sun 08:00) texts · Depends on: lead's contracts (H2) and examples (H4); `rotation_templates.csv` from package 04 (H0-H2)

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies outside the allowlist. Only create or edit the files listed under "Files to deliver".
> Keep the signatures. Write the failing test first, then the code (Strict TDD). Tests never call the network.
> The engine is pure Python: no files, network, DuckDB or FastAPI inside `engine/src/`. If something in the contract
> seems wrong, tell me instead of changing it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026, Challenge 7). The farmer enters current primera/postrera crops, priorities (1-5 for water, soil, income, risk) and irrigation; the app compares the current rotation with two alternatives. You build the brain: the crop catalog, the season calendar, the scoring and the choice of the 3 options, with their one-line texts. The API (lead) calls your function; you also set up the Render service that hosts the API and run the H20 integration check.

## Scope

- In: `data/catalog/crops.csv` (+ coverage test), `calendar.py`, Scoring v1, selection, `recommended`, F1/F2, per-option confidence, deltas, `bare_months`, one-line texts, `InvalidRequestError`, golden tests and the H2-H3 hand-computed demo vectors, `render.yaml` + Render service by H8, H20 (Sun 04:00) integration check.
- Out of scope: `risks.py` (data owner), API endpoints and error mapping (lead), `rotation_templates.csv` (web-results), anything in `contracts/` or `web/`. Full multi-line texts are SHOULD 0.

## Milestones (clock time) and sleep shift

| When | You deliver |
|---|---|
| H0-H2 Sat 08:00-10:00 (no repo yet) | Turn the lead's curated crop list into `crops.csv` (every value sourced, `local_source` per crop) and the calendar constants |
| H2-H3 Sat 10:00-11:00 | Clone, green `make check`. Hand-compute the golden scores on the real `crops.csv` and pin the demo vectors (0.05 d). First PR: `calendar.py` + `crops.csv` + coverage test (the data owner needs `bare_months`) |
| H8 Sat 16:00 | Render service live from `render.yaml`; `/health` answers on the public URL |
| H10 Sat 18:00 | Scoring + selection green against `contracts/examples/`. Lead spot check |
| H16 Sun 00:00 | Thin slice: 3 options with criteria, deltas, `recommended`, `bare_months` (texts may be stubs) |
| H20 Sun 04:00 | 15-min golden-point flow on the Vercel preview, if you are the one awake |
| H24 Sun 08:00 | One real line per text section |
| H28.5 Sun 12:30 | Feature freeze |

Sleep shift (set by the split; the lead and you never sleep at the same time): you sleep Sun 00:30-05:00 after the thin slice; the lead runs H20 and sleeps Sun 05:00-09:30. Swap with the lead at H0 if needed.

## Contracts (frozen — do not change)

The lead commits the real Pydantic models in `contracts/src/` at H2 (Sat 10:00) and example fixtures in `contracts/examples/` at H4. Until then use this copy; the repo files replace it.

```text
CropId = Literal fixed at H2 (cap ~10-12); always "maiz", "frijol", "maiz_frijol", "maicillo", "none"
Level = "low"|"medium"|"high"|"unknown"; Confidence = "low"|"medium"|"high"; Tier = "low"|"medium"|"high"
months are int 1-12; scores are int 1-5
Location { lat: float, lon: float }; Polygon { type: "Polygon", coordinates: float[][][] }
Priorities { water: 1-5, soil: 1-5, income: 1-5, risk: 1-5 } (default 3 each)
RecommendationRequest { location, current_rotation: { primera: CropId, postrera: CropId },
                        priorities, constraints: { irrigation: bool } }   # "none" = empty season
SiteRisk { id: "canicula"|"bare_field"|"heat"|"missing_data", level, period_months: int[],
           value: float|null, threshold: float|null, unit, source, estimated: bool, explanation_es }
SiteProfile { location, cell_polygon, cell_resolution_km,
  climate: { monthly_precip_mm[12], monthly_tmax_c[12], dekadal_precip_mm[36] },
  soil: { clay_pct, sand_pct, ph, soc_g_kg } (each nullable), soil_sample_location: Location|null,
  risks: SiteRisk[] }
Criteria { water: 1-5, soil: 1-5, income: 1-5, risk: 1-5 }; Delta = "better"|"same"|"worse"
Evidence { text_es: str, dataset: str, value: str }
RotationOption { sequence: { primera: CropId, postrera: CropId }, is_current: bool, recommended: bool,
  not_recommended_reason: str|null, bare_months: int[], criteria: Criteria,
  delta_vs_current: { water, soil, income, risk: Delta }, confidence: Confidence,
  reasons: str[], evidence: Evidence[], benefits: str[], data_gaps: str[], local_review: str[] }
CropCatalogEntry { id: CropId, name_es, icon (emoji Unicode <= 11 or small SVG path), seasons:
  ("primera"|"postrera")[], cycle_days, water_need: Tier, n_fixing: bool, root_depth: "shallow"|"deep",
  erosion_cover: Tier, drought_tolerance: Tier, market_tier: Tier, local_source: bool, source }
RotationTemplate { id, primera: CropId, postrera: CropId, description_es, source }
```

Stub until package 04 lands `rotation_templates.csv`: write 3-4 test-only templates in `engine/tests/conftest.py` from the lead's curated list (e.g. `maiz_frijol -> maicillo`, `frijol -> maicillo`, `maiz -> frijol`); replace with the real CSV in the golden tests. Stub `SiteProfile` until H4 (then use `contracts/examples/`): Chiquimula location (14.70, -89.50), any 12/12/36 climate arrays, soil {clay_pct 30.0, sand_pct 40.0, ph 6.5, soc_g_kg 12.0}, one `canicula` risk with level `high`; a second variant with all soil fields `None` for the confidence tests.

## Rules (from the approved plan)

**`crops.csv`** columns = `CropCatalogEntry` fields; one row per `CropId`, in the lead's order. Sources: FAO ECOCROP (gaez.fao.org/pages/ecocrop), AquaCrop-OSPy / FAO-56 for water and roots, ICTA/MAGA guides for local varieties; USDA PLANTS only as "referencia general (EE. UU.)". Every value cites its source; `local_source` true only for a Guatemalan source. Crop values change only with a source, never to pass a test.

**Calendar (`calendar.py`, source: team research guide, sec. 2).** Primera planted in May; postrera planted in September. A crop covers `ceil(cycle_days / 30)` months from its planting month, wrapping past December; months covered by either season count as covered; `bare_months` = the rest, sorted as the calendar runs (Dec first if present, then Jan..). `none` covers nothing. Used by `risks.py` too.

**Scoring v1** (values change only with a test):

| Step | Rule |
|---|---|
| Tier to number | low = 1, medium = 2, high = 3 |
| Water (per crop) | 7 - 2 x water_need (low 5, medium 3, high 1). "Water" means water saved, so irrigation never raises it |
| Soil (per crop) | 1 + 2 x n_fixing + (erosion_cover - 1); if the site's SoilGrids SOC is below the low-SOC threshold (cited and fixed in `data/README.md` at H2), n_fixing crops get +1 more and the option gets an `Evidence` item citing SoilGrids SOC; null soil -> no adjustment plus a `data_gaps` line |
| Income (per crop) | market_tier 1 -> 1, 2 -> 3, 3 -> 5 |
| Risk (per crop) | drought_tolerance 1 -> 1, 2 -> 3, 3 -> 5; primera crops lose 1 if canícula is high, 0.5 if medium (the canícula falls in the primera cycle); with irrigation, high-water crops get +1 |
| `none` row | water 5, soil 1, income 1, risk 5 (fallow saves water but leaves soil bare and earns nothing); exempt from the canícula penalty |
| Season combination | water, soil, income = mean of primera and postrera; risk = min of the two |
| Bare months | soil - 0.5 when `bare_months` has 6 or more months |
| Clamp and rank | clamp each criterion to 1-5 as a float; weighted score = sum(priority x criterion) / sum(priority); rank on floats; tie-break by CSV order; `criteria` in the response are rounded with `math.floor(x + 0.5)` (not Python `round`, which rounds half to even; unit test at 2.5) |
| Deltas | computed from the rounded integer criteria, so bars and arrows always agree: better if higher, worse if lower, else same |
| Failure rules (`recommended=false`, option still shown) | F1: canícula high and primera crop water_need high and no irrigation -> "Necesita mucha agua justo en la canícula". F2: canícula high and primera crop drought_tolerance low and no irrigation -> "Aguanta poco la sequía de la canícula" |

The low-SOC threshold value comes from the data owner's `data/README.md`; copy it into a named constant with the citation in a comment.

**Selection.** Score every template whose (primera, postrera) differs from the current rotation. Slot 1 = best passing alternative (if any); slot 2 = best remaining template, passing or not; if none passes, top 2 by score. Output order: current first, then slot 1, slot 2. Failures set `recommended=false` + `not_recommended_reason`; they never remove a template.

**`recommended`.** True only for the slot-1 alternative, only if it passes and its weighted score is strictly greater than the current's; never for the current. The current also gets F1/F2: its `not_recommended_reason` is set (the UI shows it as ⚠), `recommended` stays false. Irrigation lifts the risk of high-water crops and disables F1/F2.

**Confidence (per option).** factors = (1 if any site soil field is null) + (number of non-`none` crops in the option with `local_source=false`); 0 = high, 1 = medium, 2+ = low. The bare-field estimate is not a factor. If every option is low, that is the honest result; never tune values.

**Texts (one line each by H24, Spanish, usted).** `reasons`: one line citing the farmer's top priority (ties: water > soil > income > risk). `evidence`: dataset-named items (NASA POWER canícula share; SoilGrids SOC when the low-SOC rule fires). `benefits`, `local_review` (e.g. "Consulte con un técnico ..."), `data_gaps` (null soil line; "valor general, validar localmente" when a crop is not local; POWER rain is a regional estimate; if soil is cut: "suelo no incluido en esta versión").

**Errors.** A crop in a season it does not support (e.g. from an edited URL) raises `InvalidRequestError`; the API maps it to 422 `invalid_request`.

## Files to deliver

| Path | Purpose |
|---|---|
| `data/catalog/crops.csv` | Crop catalog, sourced |
| `data/tests/test_crops_catalog.py` | Catalog covers exactly `CropId` |
| `engine/src/engine/calendar.py` | Planting months, `bare_months` |
| `engine/src/engine/scoring.py` | Scoring v1, rounding, deltas, confidence, F1/F2 |
| `engine/src/engine/recommend.py` | Selection, `recommended`, texts assembly |
| `engine/src/engine/texts.py` | One-line Spanish texts |
| `engine/src/engine/errors.py` | `InvalidRequestError` |
| `engine/tests/*` (except `test_risks.py`) | Unit + golden tests, fixtures |
| `render.yaml` (repo root) | Render Blueprint for the API |

Not yours: `engine/src/engine/risks.py`, `engine/tests/test_risks.py` (data owner).

## Skeletons (spec; keep the signatures)

```python
# engine/src/engine/calendar.py
PRIMERA_PLANTING_MONTH = 5   # May
POSTRERA_PLANTING_MONTH = 9  # September
def covered_months(crop: CropCatalogEntry, planting_month: int) -> set[int]: ...
def bare_months(primera: CropCatalogEntry, postrera: CropCatalogEntry) -> list[int]: ...

# engine/src/engine/scoring.py
def round_half_up(x: float) -> int: ...                       # math.floor(x + 0.5)
def score_option(site: SiteProfile, primera: CropCatalogEntry, postrera: CropCatalogEntry,
                 irrigation: bool) -> dict[str, float]: ...   # clamped float criteria
def weighted_score(criteria: dict[str, float], priorities: Priorities) -> float: ...
def failure_reason(site: SiteProfile, primera: CropCatalogEntry, irrigation: bool) -> str | None: ...
def confidence(site: SiteProfile, crops: list[CropCatalogEntry]) -> Confidence: ...

# engine/src/engine/errors.py
class InvalidRequestError(ValueError): ...

# engine/src/engine/recommend.py
def recommend(site: SiteProfile, request: RecommendationRequest,
              crops: list[CropCatalogEntry], templates: list[RotationTemplate]) -> list[RotationOption]: ...
# returns exactly 3: current, slot 1, slot 2
```

Worked example (illustrative tiers, not the real catalog): maíz primera water_need medium, n_fixing no, erosion medium, drought low, market medium -> water 3, soil 2, income 3, risk 1 - 1 (canícula high) = 0. Frijol postrera water low, n_fixing yes, erosion low, drought medium, market high -> water 5, soil 3, income 5, risk 3. Combined: water 4, soil 2.5, income 4, risk min(0, 3) = 0 -> clamp 1. Bare months Dec-Apr = 5 (no penalty). Rounded: 4, 3, 4, 1. Weighted with 5/3/3/3: (20 + 7.5 + 12 + 3) / 14 = 3.04.

## Tests (run before every PR)

Run: `uv run pytest engine data/tests/test_crops_catalog.py` then `make check`.

| Case | Given / When | Then |
|---|---|---|
| Coverage | `crops.csv` ids vs `CropId` | equal sets, no duplicates |
| Bare months | maíz -> frijol | `[12, 1, 2, 3, 4]` (5 months) |
| Rounding | `round_half_up(2.5)`, `(3.49)` | 3, 3 |
| `none` row | `none` in postrera | water 5, soil 1, income 1, risk 5; no canícula penalty |
| Irrigation | same request with irrigation true vs false | risk criterion changes for a high-water crop; water criterion never changes |
| F1 | canícula high, primera crop water_need high, no irrigation | `not_recommended_reason` == "Necesita mucha agua justo en la canícula" |
| F2 | canícula high, primera drought_tolerance low, no irrigation | "Aguanta poco la sequía de la canícula" |
| F1 + irrigation | same as F1 with irrigation | reason None |
| Deltas | current rounded soil 3, option rounded soil 4 | soil "better"; equal rounded -> "same" |
| Confidence | soil null + one non-local crop | "low"; all soil + all local -> "high" |
| Every rotation | every season-valid (primera, postrera) incl. none/none | exactly 3 options, distinct sequences, first `is_current` |
| Current wins | a current rotation that beats every alternative | no option has `recommended` true |
| Ties | two templates with equal score | the earlier CSV row wins |
| Invalid season | a crop in a season not in its `seasons` | raises `InvalidRequestError` |
| Golden (pinned H2-H3) | Chiquimula, maíz -> frijol, priorities 5/3/3/3 vs 3/3/5/3 (or more extreme vectors such as 5/1/1/1 vs 1/1/5/1, or another current rotation, pinned from hand-computed scores) | each returns a non-null recommended option, and the two differ |

```python
# engine/tests/test_calendar.py
from engine.calendar import bare_months

def test_maize_then_bean_leaves_dec_to_apr_bare(maiz, frijol) -> None:
    assert bare_months(maiz, frijol) == [12, 1, 2, 3, 4]
```

Record the hand computation for the golden vectors in the golden test's docstring; never change crop values to make it pass.

## Render (by H8) and H20 check

`render.yaml` at the repo root: one free web service for `api/`, Python 3.13, build `uv sync --package api --no-dev --frozen`, start the FastAPI app on `$PORT` (confirm the exact start command against the lead's skeleton), health check path `/health`, auto-deploy from `main`. Give the public URL to the web-map owner for `VITE_API_URL`. Free instances sleep; the web-results owner sets up the pinger. H20 (Sun 04:00, 15 min, whoever of you and the lead is awake): on the Vercel preview, Chiquimula -> risks -> form maíz -> frijol, water first -> comparison; then income first; compare `data_version` in `/health` and the static files; post the result in the team chat.

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

At H2: `git clone <repo-url>`, `cd <repo-folder>`, `Copy-Item .env.example .env`, `uv sync`, `fnm install`, `npm --prefix web ci`, `make check` (must be green before you change anything). Troubleshooting: `make` not found -> `winget install ezwinports.make`, reopen; format check fails on untouched files -> `git add --renormalize .` then `git checkout -- .`; wrong Python -> `uv python install 3.13`, `uv sync`.

## Conventions

- Stack: Python 3.13 (uv workspace): FastAPI, Pydantic, DuckDB, pandas, xarray, rioxarray, earthaccess, httpx; TypeScript (Node 24): React + Vite, MapLibre, Recharts; Parquet in `data/output/` read with DuckDB.
- Folders: `contracts/` (lead only), `data/` pipeline, `engine/` pure rules, `api/` (lead only), `web/` (`web/src/contracts/` generated), `docs/`.
- Naming: `snake_case` functions, `PascalCase` classes, JSON `snake_case`. Code and comments English; text strings in Spanish (Guatemala), usted.
- Commands: `uv run ruff format .`, `uv run ruff check .`, `uv run mypy contracts/src engine/src api/src data/src`, `uv run pytest`. Done = `make check` green.
- Strict TDD; tests never call the network. Tests may read `data/catalog/*.csv` with the stdlib `csv` module; `engine/src/` never reads files.
- No new dependencies (engine: stdlib + pydantic + `contracts`). Never edit `contracts/`, `api/`, `web/src/contracts/` or others' files; never weaken checks; no secrets.

## How to deliver

```powershell
git switch main; git pull
git switch -c engine/scoring
make check
git add engine data/catalog/crops.csv data/tests/test_crops_catalog.py render.yaml
git commit -m "feat(engine): score options with Scoring v1"
git push -u origin engine/scoring
```

Open the PR on github.com. Conventional commits with module scope; no AI attribution or `Co-Authored-By` lines. You self-merge (squash) your own green PRs in your files; ubuntu CI guards merges from H2, branch protection (0 approvals) from H8. PR description, 3 lines: done, not done, surprises.

## Done when

- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Only your files changed; no contract or dependency changes; crop values all sourced
- [ ] Render serves `/health` publicly; H20 check reported

## SHOULD items you may pull after H24

SHOULD 0: full engine texts (several lines per section). Then ask the lead for the next unassigned item.

## Working with your browser AI

- Create a Claude.ai Project (or ChatGPT Project); add this file as project knowledge. After H4 add `contracts/src/contracts/*.py` and `contracts/examples/*.json`.
- Paste the Scoring v1 table and ask for the test of one row at a time, then the code.
- Paste `crops.csv` when asking for golden tests; check every AI-suggested crop value against a real source before using it.
- Paste errors verbatim. If the AI wants a new library or file I/O in `engine/src/`, say no.

## Lead notes

Updated Sat 2026-11-14 09:20. The lead adds new notes at the top of this section; `git pull` to get them.

### What already exists in `main`

- Repo: https://github.com/FreidhYMorales/agroayuda (public). Accept the collaborator invite first, or `git push` fails.
- `make check` is green. CI runs it on every PR; `main` only accepts PRs with a green `check`.
- Contracts are frozen: models in `contracts/src/contracts/models.py`, fixtures in `contracts/examples/`, TS types in `web/src/contracts/contracts.ts` (generated, do not edit).
- `CropId` is final: `maiz`, `frijol`, `maiz_frijol`, `maicillo`, `maiz_maicillo`, `caupi`, `canavalia`, `ajonjoli`, `ayote`, `none`.
- Typed examples to copy: `data/src/data_pipeline/parquet_io.py` (Parquet with DuckDB), `api/src/api/repository.py` (DuckDB query), `web/src/api/client.ts` (fetch wrapper).
- The API only has `/health` for now; `/site` and `/recommendations` are the lead's next task (L4). Until then, work against `contracts/examples/` and mocked `fetch`.
- The crop values in `contracts/examples/crop_catalog.json` and the templates in `rotation_templates.json` are fake ("EXAMPLE FIXTURE"). Real values go in `data/catalog/*.csv`, always with a source.

### Branches

One short branch per task, named `engine/<task>` (e.g. `engine/crops-catalog`). Merge it with "Squash and merge", delete it, `git switch main; git pull`, and start the next task on a new branch. Never keep working on a branch after it was merged. Commit messages stay `type(engine): ...`.

### Gotchas found while bootstrapping

- Python test file names must be unique across the whole repo (pytest default import mode): use `data/tests/test_grid.py`, not a second `test_smoke.py`. If pytest says "import file mismatch", rename your file.
- Do not add `__init__.py` to any `tests/` folder.
- Lint and format for web is Biome (`npm --prefix web run lint`, `npm --prefix web run format`), not ESLint or Prettier.
- Ruff line length is 100; `make fmt` fixes formatting.

### Notes for you (engine)

- **Sources to start `crops.csv` (Sat 09:50):** `docs/crop-sources.md` has verified sources per crop (ICTA, CGIAR, FAO-56 Table 22, ECOCROP) with page or table references, a suggested `local_source` per crop, and an open modelling question about `maiz_maicillo` (relay). Tiers are still your call; cite the source in each row.

- `CropId` is final (list above). `crops.csv` needs exactly one row per id, columns = `CropCatalogEntry` fields in that order.
- Import contract types with `from contracts import CropCatalogEntry, RotationOption, SiteProfile, ...`.
- Fixtures for your tests: `contracts/examples/site_profile.json` and `site_profile_null_soil.json` (the null-soil variant for the confidence tests).
- Render (by H8): build command `uv sync --package api --no-dev --frozen`; start command `uv run --package api fastapi run api/src/api/main.py --host 0.0.0.0 --port $PORT`; health check path `/health`.
- `rotation_templates.csv` (package 04) must be season-valid against your `seasons` column: agree on each crop's seasons with the web-results owner early.
