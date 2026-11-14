# Story 01: Compare my rotation with two alternatives

## Story

01. As a farmer, I want to enter my current rotation and see it next to two alternatives scored on water, soil, income and risk so that I can compare them.

## Acceptance criteria

- [ ] Given the crop catalog, when it is loaded, then it has exactly one row per `CropId`, every row cites a source, and every value matches `CropCatalogEntry`.
- [ ] Given the Chiquimula site and current rotation maíz → frijol, when the engine recommends, then it returns exactly 3 options: the current one first (`is_current`), then two distinct alternatives from the templates, each with water, soil, income and risk as integers 1-5 and its `bare_months`.
- [ ] Given any season-valid current rotation (including none → none), when the engine recommends, then it still returns exactly 3 options with distinct sequences and the current one first.

## Plan

- Build the sourced crop catalog from `docs/crop-sources.md`; tiers are proposed with their citation and approved by the user row by row.
- Season calendar: primera in May, postrera in September, months covered per crop, the rest are bare months (Dec first).
- Per-crop scores from the Scoring v1 table (tier → number, `none` row), combined per season (mean; risk = min), clamped 1-5 and rounded half up.
- Selection: score every template that differs from the current rotation, rank with equal weights, tie-break by template order; output current, slot 1, slot 2.
- Tests use the contract example sites and stub templates in the test fixtures until package 04's templates land.

## Out of scope

- Farmer priorities in the ranking (#02), bare-month soil penalty (#03), canícula penalty (#04), F1/F2 (#05), irrigation (#06), `recommended` (always false here, #07), deltas (always "same" placeholder only if the contract requires a value, #08), low-SOC rule (#09), confidence (fixed placeholder, #10), invalid-season error (#11), texts (empty lists, #12).
- `risks.py`, `api/`, `contracts/`, `rotation_templates.csv`, Render.

## Suggestions (your call)

- Placeholder fields (`recommended`, deltas, confidence, texts) are filled with the simplest contract-valid value so the API can switch to the real engine now; each later story replaces one.

## Size

normal
Risk: item 3 (`recommend()` output and `crops.csv` are consumed by the API and the data pipeline)

## Log

- L1 request: /flow:story 01
- L2 test list approved: catalog coverage, calendar (maize-bean, fallow, past December), half-up rounding, worked example + fallow row, recommend Chiquimula maize-bean, every season-valid rotation, tie-break by template order.
- L3 crops.csv tiers approved row by row; "(team)" in `source` marks judgment tiers.
- L4 commits: ec8dbe5 -> 936054a (catalog), e85cd62 -> fb5d5c4 (calendar), 6cb2177 (calendar triangulation), 0c725e8 -> 3f656f2 (rounding), 2f91d35 -> c35f610 (scoring), c0f6fb1 -> e3a2ebe -> 2a60fcf (recommend + mypy fix), 5e1af5d (every rotation), 640907b (ties).
- L5 deviations: 6cb2177, 5e1af5d, 640907b were green on first run (logic already existed); each was proven by a mutant. e3a2ebe was committed with 2 mypy errors, fixed in 2a60fcf.
- L6 make check: 128 passed (Python), 9 passed (web), mypy/ruff/biome clean.
- L7 verifier: PASS (8 mutants caught; contract round-trip through read_catalog_csv and parquet OK). Notes: the API stays on the stub engine until `engine/errors.py` exists (story 11), so placeholders do not go live yet; recommend() raises IndexError with fewer than 2 differing templates, so rerun the every-rotation test against the real rotation_templates.csv when package 04 lands it.
- Risk: item 3 (`recommend()` output and `crops.csv` are consumed by the API and the data pipeline)
