# Story 14: Priorities visibly change the recommendation

## Story

14. As a farmer, I want water-first and income-first priorities to recommend different rotations at Chiquimula on the real templates so that my priorities visibly matter. Requires: #13

## Acceptance criteria

- [ ] Given Chiquimula with its real canícula level (low), the real `crops.csv` and `rotation_templates.csv`, current rotation maíz → maicillo and no irrigation, when the priorities are water first (5/3/3/3), then the recommended option is gandul → nada.
- [ ] Given the same site, catalog, templates and current rotation, when the priorities are income first (1/1/5/1), then the recommended option is maíz → frijol, so the two recommendations differ.

## Plan

- A golden test of the engine on the real catalog and the real templates (stdlib csv, as the crop fixtures already do), with the shared example site switched to the real Chiquimula canícula level (low, per `docs/spec.md` demo data).
- No engine rule or crop value changes: the current rules already give these answers (hand check 2026-11-14: water first gandul → nada 4.04 vs current 2.50; income first maíz → frijol 3.44 vs current 2.12, with every alternative passing F1/F2 at low canícula). Expected scores are hand-computed from `crops.csv` in the test comments.
- The demo is re-pinned through the lever the spec allows ("another current rotation" and "more extreme vectors"): maíz → maicillo with 5/3/3/3 vs 1/1/5/1, because maíz → frijol already has the highest income of all templates and no alternative beats it on income.
- Docs updated in the same change so everyone demos the same thing: the spec's golden rule and demo flow, the engine package's golden row and the web-results package's screen-recording steps.

## Out of scope

- Changing crop values, weights, the recommendation threshold or templates to keep maíz → frijol in the demo.
- New templates from the PR #38 feedback (`maiz__ajonjoli`, `canavalia__none`); if they land later, this golden test reruns and tells whether the demo still holds.
- The low SOC bonus (story 09).

## Suggestions (your call)

- The golden test passes on the first run because no code changes; prove it with a mutant (e.g. drop the income weight) so it is not a trivial green.

## Size

small
Risk: none

## Log

- L1 request: si, dale con /flow:story 14
- L2 user chose option 1: re-pin the demo to maíz → maicillo with 5/3/3/3 vs 1/1/5/1 (with maíz → frijol, income first leaves the current rotation as the best, so no option is recommended).
