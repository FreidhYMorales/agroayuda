# Work package 06: Data — rest of Guatemala's Dry Corridor municipalities

Owner: ________ · Estimate: 1 dev-day · Due: after the event; never merged between the H28.5 (Sun 12:30) freeze and the end of judging · Depends on: package 05's **base PR** (`data/adm2-base`) merged into `main`; steps 1-2 (source and list) start right away, in parallel with it

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies. Only create or edit the files listed under "Files to deliver".
> Write the failing test first, then the code (Strict TDD). Tests never call the network.
> Never invent which municipalities belong to the Dry Corridor: they come from a cited source.
> If something in the contract seems wrong, tell me instead of changing it.

## Context

AgroAyuda covers the Dry Corridor of eastern Guatemala: five whole departments (Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa), set by `REGION_ISO` in `data/src/data_pipeline/__main__.py`. Package 05 adds the Dry Corridor municipalities (ADM2) of Huehuetenango. This package adds **the Dry Corridor municipalities of every other department** that an official list names (the source decides which; for example it may include parts of Baja Verapaz, Quiché, Santa Rosa or Guatemala).

Why only the Dry Corridor and not all of Guatemala: the engine's rules, the dry-spell (canícula) risk, the primera/postrera calendar, the crop catalog and the rotation templates are all sourced for the Dry Corridor. Outside it (Petén, Izabal, the Pacific coast, the humid highlands) they would give advice that does not apply. Covering those areas needs new crops, calendars and rules: a contract change and a separate plan, out of scope here.

Package 05 is done by a different teammate at the same time. The two packages edit the same pipeline files and the same generated outputs, so they follow the order in "Working in parallel with package 05" below.

This is data-only work: the API and the web read `region.parquet`, `sites.parquet`, `region.geojson`, `rain.geojson` and `demo_points.json` and pick up the new area without code changes.

## Scope

- In: a cited list of Dry Corridor municipalities outside the five current departments and Huehuetenango; their geoBoundaries ADM2 features added to the region through package 05's base helpers; their POWER cells computed by the existing pipeline; one demo point per newly covered department; README and resources rows.
- Out of scope: departments or municipalities not in the cited list; new crops or `CropId` changes; new calendars or rules; changes to `contracts/`, `api/`, `engine/` or `web/src/`; any merge before judging ends.

## Contracts (frozen — do not change)

No contract changes. The outputs keep their schemas:

- `region.geojson`: FeatureCollection; each feature has `properties.shapeName` and `properties.shapeISO` (use `""` for ADM2 features if geoBoundaries has no ISO for them), plus the top-level `data_version`. **Every feature geometry is a `Polygon`**: the web's `regionBounds` (`web/src/features/map/mapGeo.ts`) reads only `Polygon`. Package 05's base PR splits ADM2 `MultiPolygon`s into one feature per polygon; reuse it, do not rewrite it.
- `region.parquet`: one row per ring (`ring DOUBLE[][]`), read by the API's even-odd point-in-region test. More rings are fine.
- `demo_points.json`: list of `DemoPoint { id, name_es, location { lat, lon } }`.
- `sites.parquet`: one `SiteData` per POWER cell that touches the region, same as today.

## Working in parallel with package 05

| Phase | Package 05 owner | You (package 06) |
|---|---|---|
| A (now) | Base PR `data/adm2-base`: ADM2 loading, name + department matching, MultiPolygon split, their tests; **no pipeline run** | Steps 1-2: find the source, build the list, send it to the lead. Agree with the package 05 owner on **one source** for both lists |
| B (after the base PR is in `main`) | List PR `data/huehuetenango`: Huehuetenango list + its demo point; **no pipeline run** | List PR `data/dry-corridor-rest`: steps 3-4; **no pipeline run** |
| C (both list PRs in `main`, after judging) | Checks the result on a phone | **Final run** (step 5): one PR `data/regenerate-outputs` that runs the pipeline once and commits every generated file |

Rules:

- Never commit generated files (`web/public/data/**`, `data/output/*`) in phases A and B: two branches regenerating them always conflict, and those conflicts can only be fixed by running the pipeline again.
- Phase B tests use hand-made fixtures, so they pass without the regenerated outputs.
- If the source names Huehuetenango municipalities too, they go in package 05's list, not yours.

## Steps

1. **Source first (no code yet).** Find an official list of Guatemala's Dry Corridor municipalities (MAGA, SESAN, FAO or a similar institution); prefer the same source package 05 used, so both lists agree. Write down the exact document, year, page and every municipality name with its department. If the source only names departments, not municipalities, stop and tell the lead.
2. **Compare with what is covered.** Drop municipalities already inside the five ADM1 departments or in package 05's Huehuetenango list. What remains is this package's list. Send it to the lead before writing code.
3. **Region selection (phase B).** Add the list as a constant next to package 05's (one entry per municipality with its department, plus a source comment), using the base PR's name + department matching (some municipality names repeat across departments). The base helpers already fail loudly when a listed municipality is not found or matches more than one feature; add tests for your entries.
4. **Demo points (phase B).** Add one `DemoPoint` inside each newly covered department (e.g. a main town of a listed municipality), `name_es` like `"<Municipio>, <Departamento>"`. Keep Chiquimula first (golden point), keep the Huehuetenango point, and keep the outside point (Ciudad de Guatemala) outside the region; if the source puts it inside, tell the lead and pick another outside point.
5. **Final run (phase C, only when both list PRs are in `main`).** On a fresh branch `data/regenerate-outputs` from `main`, run the pipeline once (`uv run --package data-pipeline python -m data_pipeline`) and commit every regenerated output, as `data/README.md` describes. Cache every POWER and SoilGrids response (more cells means more calls); if POWER rate-limits you, rerun from the cache instead of lowering the history.
6. **Document.** In the list PR: the source of the list in `data/README.md`. In the final-run PR: the new cells (yours and Huehuetenango's) in the dry-spell table and the number of cells before and after. Add the rows to `docs/resources.md` and your row to `docs/si-usage.md`.

## Files to deliver

| Path | Purpose |
|---|---|
| `data/src/data_pipeline/__main__.py` | Municipality list constant (name + department, cited) |
| `data/src/data_pipeline/outputs.py` | New `DEMO_POINTS` entries (matching and the MultiPolygon split come from package 05's base PR) |
| `data/tests/test_region_dry_corridor.py` | Tests below (unique file name) |
| `data/README.md` | Source of the list (list PR); new cells in the dry-spell table and cell count (final-run PR) |
| `web/public/data/region.geojson`, `layers/rain.geojson`, `demo_points.json`, `data/output/*` | Final-run PR only (phase C) |
| `docs/resources.md` | Row for the municipality-list source (if new) |
| `docs/si-usage.md` | Your row |

## Tests (pytest; small hand-made GeoJSON fixtures, no network)

| Case | Given / When | Then |
|---|---|---|
| Selection | ADM2 fixture with your listed entries plus 2 unlisted ones | only your listed features are selected |
| Same name, other department | two features share a name in different departments, one listed | only the one in the listed department is selected |
| Region rings | ADM1 + Huehuetenango ADM2 + new ADM2 fixtures | a point inside a new municipality is inside the region; one inside an unlisted neighbour is not |
| Demo points | `DEMO_POINTS` and the real region rings from a recorded fixture | every new point is inside; Chiquimula is first; the outside point is outside |
| Pipeline | `run()` with fake fetchers and the fixtures | a site is written for a cell of a new municipality |

Matching errors (missing name, duplicate match) and the MultiPolygon split are tested in package 05's base PR; do not duplicate them. Run `uv run pytest data/tests`, then `make check`.

## Conventions

- Python 3.13, `snake_case`; code, comments and docs in English; `name_es` in Spanish.
- No new dependencies. Tests never call the network: use recorded or hand-made fixtures.
- Values change only with a cited source. Never tune the dry-spell cut-offs after seeing the new cells.
- Branches `data/dry-corridor-rest` (list) and `data/regenerate-outputs` (final run), conventional commits (`feat(data): ...`), PR with 3 lines: done, not done, surprises. Done = `make check` green.

## Done when

- [ ] The municipality list has a cited source in `data/README.md` and `docs/resources.md`
- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Final-run PR merged with the regenerated outputs; `/site` at every new demo point answers a `SiteProfile` (not `outside_region`) on the PR's preview; the outside point still answers `outside_region`
- [ ] The map opens framed on the whole region on a phone (Vercel preview)
- [ ] Only the files above changed

## Coordination

- **Region mask (from `data/region-mask`, if merged).** `dissolve` in `outputs.py` drops a border only when two rings share exactly the same vertices. That holds between ADM1 departments of one file, but ADM2 municipalities come from another geoBoundaries file and may not match ADM1 vertex by vertex, which would leave slivers or overlapping holes in `region_mask.geojson`. Add a test with an ADM1 fixture plus an adjacent ADM2 fixture from the real files, and tell the lead if the mask breaks; do not change `dissolve` without the data owner.
- Lead: confirm the source (step 1) and the final list (step 2) before you write code; merge only after judging ends.
- Package 05 owner: one source for both lists; review their base PR (you will build on it); tell them when your list PR is in `main` so they can check the final run on a phone.
- Web map owner (package 03): with a wider region the first map view zooms out; check that cells stay tappable at phone width and report it if they do not (a web change is theirs, not part of this package).

## Lead decisions (2026-11-15)

- **Source confirmed:** SESAN, *Plan de Respuesta para la Atención del Hambre Estacional 2016*, Anexo 1, printed pages 28-30 (https://portal.siinsan.gob.gt/wp-content/uploads/Plan-de-Respuesta-para-la-Atencion-del-Hambre-Estacional-2016.pdf). Same source as package 05.
- **South coast out.** The plan defines the Dry Corridor as 11 departments (section 4.1) and adds Escuintla, Retalhuleu, San Marcos, Santa Rosa and Suchitepéquez only as "otros departamentos afectados". Those 16 municipalities are not listed. Your list is the 29 municipalities of Baja Verapaz (7), Chimaltenango (3), Guatemala (5), Quiché (10) and Totonicapán (4) from Anexo 1.
- **Whole municipalities, no threshold.** List every Anexo 1 municipality of those departments, even when only part of it is inside the corridor; the `data/README.md` mountain-terrain note covers it.
- **geoBoundaries spelling** (checked against the ADM2 file at `9469f09`): use "Comalapa", "San Raimundo", "Uspantán" and "San Bartolo"; the other 25 match the Anexo 1 names. Ciudad de Guatemala (14.63, -90.51) stays outside the region with this list.
