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
