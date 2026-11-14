# Work package 01: Data (NASA POWER, SoilGrids, static layers, site risks)

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Owner: ________ · Estimate: 1.35 dev-days (after named cut 3) · Due: H16 (Sun 00:00) thin slice; H24 (Sun 08:00) full · Depends on: lead's contracts (H2) and examples (H4); `calendar.bare_months` from package 02 (engine) for the bare-field risk

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies outside the allowlist. Only create or edit the files listed under "Files to deliver".
> Keep the signatures. Write the failing test first, then the code (Strict TDD). Tests never call the network.
> If something in the contract seems wrong, tell me instead of changing it.

## Context

AgroAyuda is a phone-first web app for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026, Challenge 7). A farmer picks a point on a map, sees the site's risks, enters their primera/postrera crops and priorities, and compares their rotation with two alternatives. You build the offline data pipeline: NASA POWER climate normals and dry spells, SoilGrids soil, the static map files, and the site-risk rules. Everything is precomputed into Parquet (read by the API) and static files (read by the web app). Using NASA POWER is what passes the challenge's NASA-data gate.

## Scope

- In: POWER daily download (cache, backoff, -999 cleanup) -> monthly, dekadal and dry-spell features per native grid cell; the H0-H2 dry-day-definition check; SoilGrids at cell centers; region, rain layer, demo points; `risks.py` (canícula, bare field, missing data); `data_version`; `data/README.md`; first responder for Python questions (escalate to the lead after 15 min).
- Out of scope: scoring and `calendar.py` (engine), `crops.csv` (engine), `rotation_templates.csv` (web-results), anything in `contracts/`, `api/`, `web/src/`. Heat risk is SHOULD 0. Named cut (3) is taken: `demo_points.json` holds only Chiquimula and one point outside the region.

## Milestones (clock time, local event)

| When | You deliver |
|---|---|
| H0-H2 Sat 08:00-10:00 (no repo yet, scratch folder) | Read refs [7] [8]; fix N and cut-offs in a note; download POWER daily for every node in the region bbox and SoilGrids at each node; run the region-wide dry-day-definition check (below) |
| H2 Sat 10:00 | Clone, green `make check`. First PR: `data/README.md` with N, cut-offs, dry-day rule, date, golden cell id, low-SOC threshold with citation, SoilGrids depth |
| H4 Sat 12:00 | Grid + -999 tests green; recorded responses committed under `data/tests/fixtures/` |
| H8 Sat 16:00 | `rain.geojson`, `region.geojson`, `demo_points.json` deployed with the first Vercel deploy (web-map needs them) |
| H10 Sat 18:00 | Full pipeline green against fixtures; Parquet in `data/output/`. Lead spot check |
| H16 Sun 00:00 | Thin slice: real Parquet incl. precomputed risks for every cell |
| H24 Sun 08:00 | All MUST done; then pull SHOULD items (bottom) |
| H28.5 Sun 12:30 | Feature freeze; bug fixes only |

## Contracts (frozen — do not change)

The lead commits the real Pydantic models in `contracts/src/` at H2 (Sat 10:00) and example fixtures in `contracts/examples/` at H4 (Sat 12:00). Until then use this inline copy; from then on the repo files replace it (paste them into your AI project).

```text
CropId      = Literal fixed at H2 from the lead's list; always includes "maiz", "frijol", "maiz_frijol", "maicillo", "none"
Level       = "low" | "medium" | "high" | "unknown"
Tier        = "low" | "medium" | "high"
Location    { lat: float, lon: float }
Polygon     { type: "Polygon", coordinates: float[][][] }   # GeoJSON order: [lon, lat]

SiteRisk { id: "canicula" | "bare_field" | "heat" | "missing_data", level: Level,
           period_months: int[] (1-12), value: float | null, threshold: float | null,
           unit: str, source: str, estimated: bool, explanation_es: str }

SiteData  # one Parquet row per POWER cell; input of risks.py; frozen at H2
{ cell_id, lat, lon, cell_polygon: Polygon,
  monthly_precip_mm[12], monthly_tmax_c[12], dekadal_precip_mm[36],
  dry_spell_year_share: float, dry_spell_rule: str,
  soil: { clay_pct, sand_pct, ph, soc_g_kg } (each nullable),
  soil_sample_lat: float | null, soil_sample_lon: float | null,
  data_version: str (pipeline run date), risks: SiteRisk[] (precomputed) }

CropCatalogEntry { id: CropId, name_es, icon, seasons: ("primera"|"postrera")[], cycle_days,
  water_need: Tier, n_fixing: bool, root_depth: "shallow"|"deep", erosion_cover: Tier,
  drought_tolerance: Tier, market_tier: Tier, local_source: bool, source }
RotationTemplate { id, primera: CropId, postrera: CropId, description_es, source }
DemoPoint        { id, name_es, location: Location }
RainCellProperties { value_mm (1991-2020 annual normal), unit, source, resolution_km }
```

Engine function you call (owned by package 02, in `engine/src/engine/calendar.py`):

```python
def bare_months(primera: CropCatalogEntry, postrera: CropCatalogEntry) -> list[int]: ...
# maíz -> frijol returns [12, 1, 2, 3, 4]
```

Example `SiteData` row for tests until H4 (placeholder numbers, not real data):

```json
{"cell_id": "14.5_-89.375", "lat": 14.5, "lon": -89.375,
 "cell_polygon": {"type": "Polygon", "coordinates": [[[-89.6875, 14.25], [-89.0625, 14.25], [-89.0625, 14.75], [-89.6875, 14.75], [-89.6875, 14.25]]]},
 "monthly_precip_mm": [5, 5, 10, 40, 110, 190, 150, 160, 190, 150, 40, 10],
 "monthly_tmax_c": [29, 30, 32, 33, 32, 30, 30, 30, 29, 28, 28, 28],
 "dekadal_precip_mm": [2,2,1, 2,2,1, 3,3,4, 10,15,15, 30,40,40, 70,60,60, 60,40,50, 50,50,60, 60,70,60, 60,50,40, 20,10,10, 4,3,3],
 "dry_spell_year_share": 0.7, "dry_spell_rule": "dry day < 1 mm; N consecutive days in Jul-Aug (adaptado de refs [7] [8])",
 "soil": {"clay_pct": 30.0, "sand_pct": 40.0, "ph": 6.5, "soc_g_kg": 12.0},
 "soil_sample_lat": 14.5, "soil_sample_lon": -89.375, "data_version": "2026-11-14", "risks": []}
```

## What to build (rules from the approved plan)

**POWER grid.** Nodes are cell centers: lat = -90 + 0.5 i, lon = -180 + 0.625 j; a cell spans ± half a step. Point -> cell = snap to the nearest node. The grid is every cell that intersects the region (~10-14 cells). Region = Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa (geoBoundaries ADM1, simplified). Before the boundary is loaded (H0-H2) use a generous bbox (about lat 13.7-15.3, lon -90.4 to -89.1) and download every node whose cell touches it.

**POWER download.** Daily `PRECTOTCORR` (mm/day) and `T2M_MAX` (°C), 1991-2020, community AG, at the exact node coordinates (point endpoint `https://power.larc.nasa.gov/api/temporal/daily/point`, no token). Cache raw responses in `data/cache/` (gitignored); retry with exponential backoff; phone hotspot if venue wifi throttles. Fill value -999 becomes NaN before any statistic.

**Features.** `monthly_precip_mm` = mean monthly total over years; `monthly_tmax_c` = mean daily max per month; `dekadal_precip_mm` = 36 dekads (days 1-10, 11-20, 21-end of each month), mean total over years. `dry_spell_year_share` = share of the 30 years with at least N consecutive dry days in July-August.

**Dry-day-definition check (H0-H2, region-wide, never on one cell).** First fix N from refs [7] https://revistas.usac.edu.gt/index.php/cytes/article/download/1284/993/6098 and [8] https://revistayuam.com/wp-content/uploads/2025/10/La-canicula-y-su-comportamiento-en-Guatemala.pdf, and fix the cut-offs: low < 1/3 of years, medium 1/3-2/3, high > 2/3. Write both down before computing any cell; never change them after looking at the golden cell. Then try, in order, over all cells: (a) dry day = < 1 mm; (b) if (a) shows no dry spells anywhere, dry day = < 10 % of the cell's mean daily July-August rain; (c) if neither works, a documented dekadal-ratio rule. Store the rule in `dry_spell_rule`, labeled "adaptado de" refs [7] [8] (official INSIVUMEH index pending). Golden cell: Chiquimula (14.70, -89.50) snaps to (14.5, -89.375); put its id in `data/README.md`. If it is not high, the demo uses the highest-share cell (its name in `demo_points.json`); cut-offs are never tuned.

**SoilGrids (fetched in H0-H2).** REST first (`https://rest.isric.org/soilgrids/v2.0/properties/query`, properties clay, sand, phh2o, soc, value mean); fallback: VRT/COG with `rioxarray`, reprojecting lat/lon to the Homolosine CRS before sampling. Sample at the cell center. Scale: SOC dg/kg, pH x10, clay/sand g/kg -> divide all by 10. Keep the recorded response as a test fixture. A null center gives null soil fields (no crash). Choose the depth (the plan does not fix it) and record it in `data/README.md`. If the H0-H2 fetch failed and cut (4) is called, soil stays null and the engine shows "suelo no incluido en esta versión".

**Risks (`engine/src/engine/risks.py`, pure, no I/O; run by the pipeline; results stored in `SiteData.risks`).**

- `canicula`: level from `dry_spell_year_share` and the fixed cut-offs; `period_months` [7, 8]; `estimated` false; `explanation_es` mentions the period and that POWER rain is a regional estimate (MERRA-2 source change). The UI shows the share next to the level ("en 18 de 30 años").
- `bare_field`: `calendar.bare_months(maíz, frijol)` (typical rotation), `estimated` true; level: 3 months or fewer = low, 4-5 = medium, 6+ = high; copy "Suelo sin cultivo de diciembre a abril (estimado, con la rotación típica maíz → frijol)".
- `missing_data`: fires when any soil field is null or a climate series has NaN after cleanup; level `unknown`; sorts last.
- Order: high, medium, low, unknown last. Heat is SHOULD 0.
- `value` / `threshold` / `unit` (proposal; confirm with the lead at H2): canícula `value` = share 0-1, `threshold` = lower cut-off of the level reached (null for low), `unit` "share of years 1991-2020"; bare field `value` = number of bare months, `threshold` null, `unit` "meses"; missing data both null, `unit` "".
- `source` strings name the dataset, e.g. "NASA POWER (PRECTOTCORR diario, 1991-2020)", "SoilGrids 2.0 (ISRIC), CC BY 4.0".

**Outputs (one pipeline run).** `data/output/sites.parquet` (one `SiteData` row per cell), `region.parquet` (region rings for the API), `crops.parquet` and `rotation_templates.parquet` (from `data/catalog/*.csv`, one schema each); `web/public/data/layers/rain.geojson` (one Polygon feature per cell, `RainCellProperties`), `region.geojson`, `crops.json`, `rotation_templates.json`, `demo_points.json` (Chiquimula + one outside point, e.g. Ciudad de Guatemala). `data_version` (run date) goes into the Parquet, the static files (proposal: a top-level `"data_version"` member in `rain.geojson`; confirm with the lead) and `/health` (lead); the phone check compares them after each deploy. Attribution (source + licence) for POWER, SoilGrids and geoBoundaries goes in `data/README.md` for the judge README.

## Files to deliver

| Path | Purpose |
|---|---|
| `data/README.md` | N, cut-offs, dry-day rule + date, golden cell id, low-SOC threshold (cited), SoilGrids depth, sources + licences |
| `data/src/data_pipeline/power.py` | POWER fetch, cache, backoff, -999 -> NaN |
| `data/src/data_pipeline/grid.py` | Node snapping, cell bounds, cells intersecting the region |
| `data/src/data_pipeline/features.py` | Monthly, dekadal normals; dry-spell share |
| `data/src/data_pipeline/soilgrids.py` | SoilGrids sample + scaling |
| `data/src/data_pipeline/outputs.py` | Parquet + static files writer, `data_version` |
| `data/src/data_pipeline/__main__.py` | One run: `uv run --package data-pipeline python -m data_pipeline` |
| `data/tests/test_*.py`, `data/tests/fixtures/*` | Tests and recorded responses (except the two catalog tests below) |
| `data/output/*.parquet`, `web/public/data/**` | Generated, committed |
| `engine/src/engine/risks.py`, `engine/tests/test_risks.py` | Site risk rules + tests |

Not yours: `data/catalog/crops.csv` and `data/tests/test_crops_catalog.py` (engine); `data/catalog/rotation_templates.csv` and `data/tests/test_rotation_templates.py` (web-results).

## Skeletons (spec; keep the signatures)

```python
# data/src/data_pipeline/grid.py
LAT_STEP = 0.5
LON_STEP = 0.625
def snap(lat: float, lon: float) -> tuple[float, float]: ...          # nearest node
def cell_bounds(lat: float, lon: float) -> tuple[float, float, float, float]: ...  # (min_lon, min_lat, max_lon, max_lat)
def cell_polygon(lat: float, lon: float) -> dict[str, object]: ...   # GeoJSON Polygon, closed ring

# data/src/data_pipeline/power.py
FILL_VALUE = -999.0
def clean_fill(series: pd.Series) -> pd.Series: ...                 # -999 -> NaN
def fetch_daily(lat: float, lon: float, cache_dir: Path) -> pd.DataFrame: ...  # cached; backoff

# data/src/data_pipeline/soilgrids.py
def scale_soilgrids(raw: dict[str, int | None]) -> dict[str, float | None]: ...  # /10 each

# engine/src/engine/risks.py  (pure)
def dry_spell_year_share(daily_mm: pd.Series, n_days: int, is_dry: Callable[[float], bool]) -> float: ...
def canicula_level(share: float) -> Level: ...
def site_risks(site: SiteData, typical_primera: CropCatalogEntry, typical_postrera: CropCatalogEntry) -> list[SiteRisk]: ...
```

If the dry-spell counting needs pandas inside `risks.py`, ask the lead (engine is pure Python; pandas there is a dependency question).

## Tests (run before every PR)

Run: `uv run pytest data engine/tests/test_risks.py` then `make check`.

| Case | Given / When | Then |
|---|---|---|
| Chiquimula cell | Given (14.70, -89.50), when `snap` + `cell_bounds` | node (14.5, -89.375); bounds (-89.6875, 14.25, -89.0625, 14.75) |
| Fill value | Given a series [1.0, -999, 3.0], when `clean_fill` | [1.0, NaN, 3.0]; monthly mean ignores the NaN |
| SoilGrids scaling | Given recorded raw {soc: 120, phh2o: 65, clay: 300, sand: 400} | {soc_g_kg: 12.0, ph: 6.5, clay_pct: 30.0, sand_pct: 40.0} |
| SoilGrids range | Given the recorded response, when scaled | clay/sand in 0-100, pH in 3-10, SOC >= 0 |
| SoilGrids null | Given a recorded null response | all four soil fields None; no exception |
| Grid consistency | Given one pipeline run | `rain.geojson` cell ids == `sites.parquet` cell ids |
| Golden canícula | Given the golden cell's real data | level == documented rule (N, cut-offs, dry-day rule) applied to that data |
| Fewer spells (engine) | Given a synthetic daily fixture with fewer and shorter dry spells (not just scaled rain) | lower `dry_spell_year_share` and a lower or equal level, strictly lower in the chosen fixture |
| Cut-offs | `canicula_level(0.2)`, `(0.5)`, `(0.8)` | "low", "medium", "high" |
| Bare field | Given maíz -> frijol | `bare_field` level "medium", `period_months` [12, 1, 2, 3, 4], `estimated` true |
| Missing data | Given `soil.ph` None | a `missing_data` risk, level "unknown", last in the list |
| Order | Given high canícula, medium bare field, missing data | ids in order canicula, bare_field, missing_data |

```python
# data/tests/test_grid.py
from data_pipeline.grid import cell_bounds, snap

def test_chiquimula_snaps_to_its_cell() -> None:
    assert snap(14.70, -89.50) == (14.5, -89.375)
    assert cell_bounds(14.5, -89.375) == (-89.6875, 14.25, -89.0625, 14.75)
```

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

At H2 (repo URL from the lead):

```powershell
git clone <repo-url>
cd <repo-folder>
Copy-Item .env.example .env
uv sync
fnm install
npm --prefix web ci
make check        # must be green before you change anything
```

`EARTHDATA_TOKEN` in `.env` is only needed for IMERG (SHOULD 3). Troubleshooting: `make` not found -> `winget install ezwinports.make`, reopen; format check fails on untouched files -> `git add --renormalize .` then `git checkout -- .`; wrong Python -> `uv python install 3.13`, `uv sync`.

## Conventions

- Stack: Python 3.13 (uv workspace): FastAPI, Pydantic, DuckDB, pandas, xarray, rioxarray, earthaccess, httpx. TypeScript (Node 24): React + Vite, MapLibre, Recharts. Data: precomputed Parquet in `data/output/`, read with DuckDB.
- Folders: `contracts/` models (lead only), `data/` pipeline, `engine/` pure rules (no I/O), `api/` FastAPI (lead only), `web/` React (`web/src/contracts/` is generated), `docs/`.
- Naming: `snake_case` functions/modules, `PascalCase` classes, JSON fields `snake_case`. Code, comments, docs in English; UI copy (`explanation_es`) in Spanish (Guatemala), usted, short plain sentences.
- Commands: `uv run ruff format .`, `uv run ruff check .`, `uv run mypy contracts/src engine/src api/src data/src`, `uv run pytest`. Done = `make check` green.
- Strict TDD: failing test first. Tests never call the network: use recorded responses in `data/tests/fixtures/`.
- No new dependencies without the lead's approval. Allowed here: pandas, xarray, rioxarray, httpx, duckdb, pydantic, earthaccess, stdlib, pytest.
- Never edit `contracts/`, `api/`, `web/src/contracts/` or files owned by others. Never weaken or skip checks. No secrets in commits.

## How to deliver

```powershell
git switch main; git pull
git switch -c data/power-download
# paste the AI's code into your files, then:
make check
git add data engine/src/engine/risks.py engine/tests/test_risks.py
git commit -m "feat(data): fetch POWER daily with cache and backoff"
git push -u origin data/power-download
```

Open the PR on github.com. Conventional commits with module scope (`feat(data): ...`, `test(engine): ...`); no AI attribution or `Co-Authored-By` lines. Merge policy: you self-merge (squash) your own green PRs that touch only your files; from H2 the ubuntu CI check guards merges, from H8 branch protection requires it (0 approvals). PR description, 3 lines: what you did, what you could not do, what surprised you.

## Done when

- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Only your files changed; no contract or dependency changes
- [ ] `data/README.md` records N, cut-offs, rule, date, golden cell, SOC threshold, depth, licences
- [ ] Parquet and static files come from one run and carry the same `data_version`

## SHOULD items you may pull after H24 (in order, only after the end-to-end path is deployed)

SHOULD 0: region mask `region_mask.geojson` (world ring with the region as holes; with web-map) and heat risk. SHOULD 1: SoilGrids nearest non-null offset inside the region (store the sample point). SHOULD 3: GPM IMERG second rain layer (0.1°) + one evidence item. SHOULD 4: heat and soil layers (with web-map).

## Working with your browser AI

- Create a Claude.ai Project (or ChatGPT Project) and add this file as project knowledge. After H4, also add `contracts/src/contracts/*.py` and the files in `contracts/examples/`, and replace the inline contract copy.
- Ask for one file at a time, test first: "Write the failing pytest for `snap`, then the code."
- Paste errors verbatim (pytest, `mypy --strict`, ruff). If the AI wants a new library, say no and ask for a stdlib/pandas version.
- The AI cannot see the repo: paste the current file before asking for changes.

## Lead notes

Updated Sat 2026-11-14 09:20. The lead adds new notes at the top of this section; `git pull` to get them.

### New (Sat 10:15): SI disclosure

Space Apps requires stating where and how AI was used for code and data. Fill your row in `docs/si-usage.md` (which AI tool you use and for what) in one of your PRs; that file and the README section are what judges see.

### What already exists in `main`

- Repo: https://github.com/FreidhYMorales/agroayuda (public). Accept the collaborator invite first, or `git push` fails.
- `make check` is green. CI runs it on every PR; `main` only accepts PRs with a green `check`.
- Contracts are frozen: models in `contracts/src/contracts/models.py`, fixtures in `contracts/examples/`, TS types in `web/src/contracts/contracts.ts` (generated, do not edit).
- `CropId` is final: `maiz`, `frijol`, `maiz_frijol`, `maicillo`, `maiz_maicillo`, `caupi`, `canavalia`, `ajonjoli`, `ayote`, `none`.
- Typed examples to copy: `data/src/data_pipeline/parquet_io.py` (Parquet with DuckDB), `api/src/api/repository.py` (DuckDB query), `web/src/api/client.ts` (fetch wrapper).
- The API only has `/health` for now; `/site` and `/recommendations` are the lead's next task (L4). Until then, work against `contracts/examples/` and mocked `fetch`.
- The crop values in `contracts/examples/crop_catalog.json` and the templates in `rotation_templates.json` are fake ("EXAMPLE FIXTURE"). Real values go in `data/catalog/*.csv`, always with a source.

### Branches

One short branch per task, named `data/<task>` (e.g. `data/power-download`). Merge it with "Squash and merge", delete it, `git switch main; git pull`, and start the next task on a new branch. Never keep working on a branch after it was merged. Commit messages stay `type(data): ...`.

### Gotchas found while bootstrapping

- Python test file names must be unique across the whole repo (pytest default import mode): use `data/tests/test_grid.py`, not a second `test_smoke.py`. If pytest says "import file mismatch", rename your file.
- Do not add `__init__.py` to any `tests/` folder.
- Lint and format for web is Biome (`npm --prefix web run lint`, `npm --prefix web run format`), not ESLint or Prettier.
- Ruff line length is 100; `make fmt` fixes formatting.

### Notes for you (data)

- **API input formats (fixed by the lead, Sat 09:40):**
  - `cell_id` = `f"{lat}_{lon}"` with the node coordinates as Python floats, e.g. `"14.5_-89.375"`. Snap with round-half-up: `math.floor((lat + 90) / 0.5 + 0.5)` and `math.floor((lon + 180) / 0.625 + 0.5)`, the same as `api/src/api/geo.py`.
  - `region.parquet`: one row per ring, a single column `ring` of type `DOUBLE[][]` holding `[[lon, lat], ...]` (closed). Outer rings and holes all go in; the API uses the even-odd rule.
  - `sites.parquet`: write it with `write_site_data` (below). `/health` reads `max(data_version)` from it.

- Write Parquet with DuckDB, as in `parquet_io.py`. `pandas.DataFrame.to_parquet` needs `pyarrow`, which is not an approved dependency: do not add it.
- `write_site_data(rows, path)` already writes `sites.parquet` from `SiteData` models; call it from your `outputs.py` instead of writing your own. The lead's API reads that file with `find_site`.
- `data_version` is a string (`"2026-11-14"`), not a date.
- Your dependencies are installed: pandas, xarray, rioxarray, earthaccess, httpx, duckdb.
- `data-pipeline` already depends on `engine`, so `from engine.risks import ...` works once `risks.py` exists.
- Put recorded POWER and SoilGrids responses under `data/tests/fixtures/`; raw downloads go in `data/cache/` (gitignored).
