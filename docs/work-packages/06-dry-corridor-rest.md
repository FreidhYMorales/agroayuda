# Work package 06: Data — rest of Guatemala's Dry Corridor municipalities

Owner: ________ · Estimate: 1 dev-day · Due: after the event (post-submission); never merged between the H28.5 (Sun 12:30) freeze and judging · Depends on: package 05 (`data/huehuetenango`) merged into `main` first, because it adds the ADM2 loading and selection this package reuses

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies. Only create or edit the files listed under "Files to deliver".
> Write the failing test first, then the code (Strict TDD). Tests never call the network.
> Never invent which municipalities belong to the Dry Corridor: they come from a cited source.
> If something in the contract seems wrong, tell me instead of changing it.

## Context

AgroAyuda covers the Dry Corridor of eastern Guatemala: five whole departments (Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa), set by `REGION_ISO` in `data/src/data_pipeline/__main__.py`. Package 05 adds the Dry Corridor municipalities (ADM2) of Huehuetenango. This package adds **the Dry Corridor municipalities of every other department** that an official list names (the source decides which; for example it may include parts of Baja Verapaz, Quiché, Santa Rosa or Guatemala).

Why only the Dry Corridor and not all of Guatemala: the engine's rules, the dry-spell (canícula) risk, the primera/postrera calendar, the crop catalog and the rotation templates are all sourced for the Dry Corridor. Outside it (Petén, Izabal, the Pacific coast, the humid highlands) they would give advice that does not apply. Covering those areas needs new crops, calendars and rules: a contract change and a separate plan, out of scope here.

This is data-only work: the API and the web read `region.parquet`, `sites.parquet`, `region.geojson`, `rain.geojson` and `demo_points.json` and pick up the new area without code changes.

## Scope

- In: a cited list of Dry Corridor municipalities outside the five current departments and Huehuetenango; their geoBoundaries ADM2 features added to the region through package 05's selection; their POWER cells computed by the existing pipeline; one demo point per newly covered department; README and resources rows.
- Out of scope: departments or municipalities not in the cited list; new crops or `CropId` changes; new calendars or rules; changes to `contracts/`, `api/`, `engine/` or `web/src/`; any merge before judging ends.

## Contracts (frozen — do not change)

No contract changes. The outputs keep their schemas:

- `region.geojson`: FeatureCollection; each feature has `properties.shapeName` and `properties.shapeISO` (use `""` for ADM2 features if geoBoundaries has no ISO for them), plus the top-level `data_version`. **Every feature geometry is a `Polygon`**: the web's `regionBounds` (`web/src/features/map/mapGeo.ts`) reads only `Polygon`. Split any ADM2 `MultiPolygon` into one feature per polygon, keeping its properties. (If package 05 already does this, reuse it.)
- `region.parquet`: one row per ring (`ring DOUBLE[][]`), read by the API's even-odd point-in-region test. More rings are fine.
- `demo_points.json`: list of `DemoPoint { id, name_es, location { lat, lon } }`.
- `sites.parquet`: one `SiteData` per POWER cell that touches the region, same as today.

## Steps

1. **Source first (no code yet).** Find an official list of Guatemala's Dry Corridor municipalities (MAGA, SESAN, FAO or a similar institution); prefer the same source package 05 used, so both lists agree. Write down the exact document, year, page and every municipality name with its department. If the source only names departments, not municipalities, stop and tell the lead.
2. **Compare with what is covered.** Drop municipalities already inside the five ADM1 departments or in package 05's Huehuetenango list. What remains is this package's list. Send it to the lead before writing code.
3. **Region selection.** Add the list as a constant next to package 05's (one entry per municipality with its department, plus a source comment). Match on **name and department**, because some municipality names repeat across departments. Fail loudly if a listed municipality is not found, or matches more than one feature.
4. **Demo points.** Add one `DemoPoint` inside each newly covered department (e.g. a main town of a listed municipality), `name_es` like `"<Municipio>, <Departamento>"`. Keep Chiquimula first (golden point), keep the Huehuetenango point, and keep the outside point (Ciudad de Guatemala) outside the region; if the source puts it inside, tell the lead and pick another outside point.
5. **Run the pipeline** (`uv run --package data-pipeline python -m data_pipeline`) and commit the regenerated outputs, as `data/README.md` describes. Cache every POWER and SoilGrids response (more cells means more calls); if POWER rate-limits you, rerun from the cache instead of lowering the history.
6. **Document.** In `data/README.md` add the new cells to the dry-spell table, the source of the list, and the number of cells before and after. Add the rows to `docs/resources.md` and your row to `docs/si-usage.md`.

## Files to deliver

| Path | Purpose |
|---|---|
| `data/src/data_pipeline/__main__.py` | Municipality list constant (name + department, cited) |
| `data/src/data_pipeline/outputs.py` | Name + department matching; MultiPolygon split if package 05 did not add it; new `DEMO_POINTS` entries |
| `data/tests/test_region_dry_corridor.py` | Tests below (unique file name) |
| `data/README.md` | New cells in the dry-spell table; source of the list; cell count |
| `web/public/data/region.geojson`, `layers/rain.geojson`, `demo_points.json`, `data/output/*` | Regenerated by the pipeline run |
| `docs/resources.md` | Row for the municipality-list source (if new) |
| `docs/si-usage.md` | Your row |

## Tests (pytest; small hand-made GeoJSON fixtures, no network)

| Case | Given / When | Then |
|---|---|---|
| Selection | ADM2 fixture with 4 municipalities in 2 departments, 2 listed | only the 2 listed features are selected |
| Same name, other department | two features share a name in different departments, one listed | only the one in the listed department is selected |
| Missing name | a listed municipality not in the fixture | raises an error naming it and its department |
| Duplicate match | the same name and department twice in the fixture | raises an error |
| Polygon only | a listed `MultiPolygon` with 2 parts | `region.geojson` has 2 `Polygon` features with the same `shapeName` |
| Region rings | ADM1 + Huehuetenango ADM2 + new ADM2 fixtures | a point inside a new municipality is inside the region; one inside an unlisted neighbour is not |
| Demo points | `DEMO_POINTS` and the real region rings from a recorded fixture | every new point is inside; Chiquimula is first; the outside point is outside |
| Pipeline | `run()` with fake fetchers and the fixtures | a site is written for a cell of a new municipality |

Run `uv run pytest data/tests`, then `make check`.

## Conventions

- Python 3.13, `snake_case`; code, comments and docs in English; `name_es` in Spanish.
- No new dependencies. Tests never call the network: use recorded or hand-made fixtures.
- Values change only with a cited source. Never tune the dry-spell cut-offs after seeing the new cells.
- Branch `data/dry-corridor-rest`, conventional commits (`feat(data): ...`), PR with 3 lines: done, not done, surprises. Done = `make check` green.

## Done when

- [ ] The municipality list has a cited source in `data/README.md` and `docs/resources.md`
- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Regenerated outputs committed; `/site` at every new demo point answers a `SiteProfile` (not `outside_region`) on the PR's preview; the outside point still answers `outside_region`
- [ ] The map opens framed on the whole region on a phone (Vercel preview)
- [ ] Only the files above changed

## Coordination

- Lead: confirm the source (step 1) and the final list (step 2) before you write code; merge only after judging ends.
- Package 05 owner: agree on the shared list constant and the ADM2 helpers, so this package extends them instead of copying them.
- Web map owner (package 03): with a wider region the first map view zooms out; check that cells stay tappable at phone width and report it if they do not (a web change is theirs, not part of this package).
