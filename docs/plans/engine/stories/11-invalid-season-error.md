# Story 11: Clear error for a crop in the wrong season

## Story

11. As a farmer who edited the link, I want a clear error when a crop is in a season it does not support so that I am not shown nonsense.

## Acceptance criteria

- [ ] Given a request with a crop in a season it does not support (e.g. maicillo in primera), when the engine recommends, then it raises `InvalidRequestError` naming the crop and the season, and the API answers 422 `invalid_request`.
- [ ] Given a request with a crop that is not in the loaded catalog, when the engine recommends, then it raises `InvalidRequestError` (422), not an internal error (500).
- [ ] Given the engine is installed, when `/health` is called, then it reports `"engine": "real"`, and `/recommendations` for Chiquimula maíz → frijol returns 3 options from the real engine.

## Plan

- Add the typed engine error the API adapter already expects, with the signature from the work package.
- Validate the current rotation against the catalog (presence and seasons) before scoring; templates are season-valid by construction and are not checked.
- The detail text follows the contract example: "<crop> is not a <season> crop".
- Rewrite the API test that pinned the stub engine so it pins the real one (user is the lead and approved touching it).

## Out of scope

- Validating templates (package 04 tests them), priorities (#02), canícula (#04), texts (#12).
- Any other change in `api/`; the adapter and the 422 mapping already exist.

## Suggestions (your call)

- Once merged, the public API serves the real engine with the dev-fixture catalog (4 example crops, fake values) and the story-01 placeholders until real data lands; worth a line in the team chat.

## Size

normal
Risk: item 3, 5 (the API's 422 contract and `/health`; merging switches the deployed API from the stub to the real engine)

## Log

- L1 request: /flow:story 11
- L2 user approved touching `api/tests/test_api_engine_adapter.py` (stub `/health` test) inside this story, and adding the missing-crop criterion.
- L3 stop (design decision): with the real engine on, the API dev fixture fails (500, KeyError 'maiz_frijol'): contracts/examples/rotation_templates.json uses maiz_frijol but contracts/examples/crop_catalog.json has only maiz, frijol, maicillo, none. Waiting on the lead's call.
- L4 lead decision after L3: the dev fixture builds crops.parquet from data/catalog/crops.csv (no contract change); this changed the crop-id expectation in test_real_engine_gets_crops_and_templates_in_file_order and required regenerating the committed api/dev-data/crops.parquet (the deployed API reads it).
- L5 commits: 994f00f -> ee56f0f (season check primera + /health real), 514b8bf -> 2985b43 + bff90ab (real catalog in dev fixture), 46c5e31 -> 87c21ff (postrera), b22d69c -> 561d7c9 (missing crop), caf36d7 (API 422 test).
- L6 deviations: cb7c020 changed a committed test to a raw-string regex (same pattern, ruff RUF043); caf36d7 passed on first run, proven by a mutant.
- L7 make check: 132 passed (Python), 9 passed (web), mypy/ruff/biome/tsc clean.
- L8 verifier: PASS. Notes: no test pins api/dev-data/crops.parquet in sync with crops.csv (pre-existing gap, checked by hand); after merge the deployed API serves real-engine placeholders (recommended false, deltas "same", empty texts) until stories 07, 08, 12.
- Risk: item 3, 5 (the API's 422 contract and `/health`; merging switches the deployed API from the stub to the real engine)
