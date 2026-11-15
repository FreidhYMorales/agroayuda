# Work package 05: Data — Huehuetenango Dry Corridor municipalities

Owner: ________ · Estimate: 0.75 dev-day · Due: after the event; never merged between the H28.5 (Sun 12:30) freeze and the end of judging · Depends on: nothing (PR #21 is merged). Package 06 builds on your base PR, so ship it first

## Paste this at the top of your AI chat

> You are helping me implement the work package below. Respect the contracts exactly; do not change them.
> Do not add dependencies. Only create or edit the files listed under "Files to deliver".
> Write the failing test first, then the code (Strict TDD). Tests never call the network.
> Never invent which municipalities belong to the Dry Corridor: they come from a cited source.
> If something in the contract seems wrong, tell me instead of changing it.

## Context

AgroAyuda covers the Dry Corridor of eastern Guatemala: five whole departments (Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa), set by `REGION_ISO` in `data/src/data_pipeline/__main__.py`. The team is from Huehuetenango, so the demo gains a second, familiar zone if the app also covers the **Dry Corridor municipalities of Huehuetenango**.

Only part of Huehuetenango is Dry Corridor (some dry valleys); the Cuchumatanes highlands are not. So this package adds **selected municipalities (ADM2)**, never the whole department (ADM1). The current crops and rotation templates stay as they are.

Package 06 (rest of the Dry Corridor municipalities) is done by a different teammate at the same time and builds on your ADM2 helpers. Both packages edit the same pipeline files and the same generated outputs, so they follow the order in "Working in parallel with package 06" below.

This is data-only work: the API and the web read `region.parquet`, `sites.parquet`, `region.geojson`, `rain.geojson` and `demo_points.json` and pick up the new area without code changes.

## Scope

- In: a cited list of Huehuetenango Dry Corridor municipalities; geoBoundaries ADM2 for those municipalities added to the region; their POWER cells computed by the existing pipeline; one demo point inside them; README and resources rows.
- Out of scope: new crops or `CropId` changes (contract change, separate package); highland calendars; changes to `contracts/`, `api/`, `engine/` or `web/src/`; whole-department Huehuetenango.

## Contracts (frozen — do not change)

No contract changes. The outputs keep their schemas:

- `region.geojson`: FeatureCollection; each feature has `properties.shapeName` and `properties.shapeISO` (use `""` for ADM2 features if geoBoundaries has no ISO for them), plus the top-level `data_version`. **Every feature geometry is a `Polygon`**: the web's `regionBounds` (`web/src/features/map/mapGeo.ts`) reads only `Polygon`, so split any ADM2 `MultiPolygon` into one feature per polygon, keeping its properties.
- `region.parquet`: one row per ring (`ring DOUBLE[][]`), read by the API's even-odd point-in-region test. More rings are fine.
- `demo_points.json`: list of `DemoPoint { id, name_es, location { lat, lon } }`.
- `sites.parquet`: one `SiteData` per POWER cell that touches the region, same as today.

## Working in parallel with package 06

| Phase | You (package 05) | Package 06 owner |
|---|---|---|
| A (now) | **Base PR** `data/adm2-base`: steps 2-3 without any list entries (ADM2 loading, name + department matching, MultiPolygon split) and their tests; **no pipeline run**. Ship it first: package 06 waits on it | Finds the source and builds their list. Agree with them on **one source** for both lists (your step 1) |
| B (after the base PR is in `main`) | **List PR** `data/huehuetenango`: the Huehuetenango list + its demo point (steps 3-4); **no pipeline run** | Their list PR; **no pipeline run** |
| C (both list PRs in `main`, after judging) | Check the result on a phone | **Final run**: one PR `data/regenerate-outputs` that runs the pipeline once and commits every generated file |

Rules:

- Never commit generated files (`web/public/data/**`, `data/output/*`) in phases A and B: two branches regenerating them always conflict, and those conflicts can only be fixed by running the pipeline again.
- Keep the helpers general (any department, not only Huehuetenango), so package 06 only adds entries.
- Huehuetenango municipalities go in your list; the other departments go in package 06's.

## Steps

1. **Source first (no code yet).** Find an official list of Dry Corridor municipalities that includes Huehuetenango (MAGA, SESAN, FAO or a similar institution). Write down the exact document, year, page and the municipality names. If no source names Huehuetenango municipalities, stop and tell the lead; the package is then dropped.
2. **ADM2 boundaries.** Pin the geoBoundaries GTM **ADM2** simplified file at the same commit as ADM1 (`9469f09`), cached like ADM1 (`data/cache/geoboundaries/`). Check its `shapeName` values against your list (accents, spelling) and its licence (add it to `docs/resources.md`).
3. **Region selection.** Base PR: a list constant next to `REGION_ISO` whose entries are (municipality, department), matched on **both** because some names repeat across departments; build the region rings and `region.geojson` from the five ADM1 departments **plus** the listed ADM2 features, splitting `MultiPolygon`s; fail loudly if a listed entry is not found, or matches more than one feature. List PR: add the cited Huehuetenango entries (with a source comment).
4. **Demo point.** Add one `DemoPoint` inside one of those municipalities (e.g. its main town), with the name in Spanish, e.g. `{"id": "<municipio>", "name_es": "<Municipio>, Huehuetenango", ...}`. Keep Chiquimula first (golden point) and the outside point.
5. **Do not run the pipeline in your PRs.** The package 06 owner runs it once in phase C, with both lists in `main`.
6. **Document.** In your list PR, in `data/README.md`: the source of the list and a line saying that in mountain terrain a ~60 km cell mixes valley and highland, so the regional data is less faithful there. Add the rows to `docs/resources.md` and your row to `docs/si-usage.md`.

## Files to deliver

| Path | Purpose |
|---|---|
| `data/src/data_pipeline/__main__.py` | Municipality list constant, ADM2 loading, region built from ADM1 + ADM2 |
| `data/src/data_pipeline/outputs.py` | ADM2 selection (name + department), MultiPolygon split, for rings and `region.geojson`; new `DEMO_POINTS` entry |
| `data/tests/test_region_huehuetenango.py` | Tests below (unique file name) |
| `data/README.md` | Source of the list; mountain-terrain note (the new cells go in with package 06's final run) |
| `docs/resources.md` | Rows: the municipality-list source, geoBoundaries ADM2 |
| `docs/si-usage.md` | Your row |

## Tests (pytest; small hand-made GeoJSON fixtures, no network)

| Case | Given / When | Then |
|---|---|---|
| Selection | ADM2 fixture with 3 municipalities, 2 listed | only the 2 listed features are selected |
| Missing name | a listed name not in the ADM2 fixture | raises an error naming it and its department |
| Duplicate name | the same name and department twice in the ADM2 fixture | raises an error |
| Same name, other department | two features share a name in different departments, one listed | only the listed department's feature is selected |
| Polygon only | a listed `MultiPolygon` with 2 parts | `region.geojson` has 2 `Polygon` features with the same `shapeName` |
| Region rings | ADM1 fixture + ADM2 fixture | rings contain both; a point inside the municipality is inside the region |
| Region GeoJSON | same inputs | features from both, each with `shapeName` and `shapeISO`, plus `data_version` |
| Disjoint cells | two far-apart square regions | `cells_intersecting` returns no cell from the gap between them |
| Demo point | `DEMO_POINTS` and the real region rings from a recorded fixture | the Huehuetenango point is inside the region; Chiquimula is still first |
| Pipeline | `run()` with fake fetchers and both fixtures | a site is written for a cell of the municipality |

The base PR carries every test except "Demo point" (list PR). Run `uv run pytest data/tests`, then `make check`.

## Conventions

- Python 3.13, `snake_case`; code, comments and docs in English; `name_es` in Spanish.
- No new dependencies. Tests never call the network: use recorded or hand-made fixtures.
- Values change only with a cited source. Never tune the dry-spell cut-offs after seeing the new cells.
- Branches `data/adm2-base` (base) and `data/huehuetenango` (list), conventional commits (`feat(data): ...`), PR with 3 lines: done, not done, surprises. Done = `make check` green.

## Done when

- [ ] The municipality list has a cited source in `data/README.md` and `docs/resources.md`
- [ ] All table tests pass; `make check` green locally and in CI
- [ ] Base PR merged first; after package 06's final run, `/site` at the demo point answers a `SiteProfile` (not `outside_region`) on its preview
- [ ] Only the files above changed

## Coordination

- Web map owner (package 03): the map's first view must include the new area (fit to the `region.geojson` bounds), and the demo-place list shows the new point automatically.
- Lead: confirm the source in step 1 before you write the list PR.
- Package 06 owner: one source for both lists; tell them as soon as the base PR is in `main`; check their final run on a phone.
