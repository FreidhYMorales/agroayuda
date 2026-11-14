# Story 02: My priorities rank the alternatives

## Story

02. As a farmer, I want my priorities to change how the alternatives rank so that the comparison fits what matters to me. Requires: #01

## Acceptance criteria

- [ ] Given criteria water 4, soil 2.5, income 4, risk 1 and priorities 5/3/3/3, when the weighted score is computed, then it is (20 + 7.5 + 12 + 3) / 14 ≈ 3.04 (the work package's worked example, on unrounded criteria).
- [ ] Given Chiquimula, maíz → frijol and water-first priorities 5/1/1/1, when the engine recommends, then frijol → maicillo comes before maíz con frijol → maicillo.
- [ ] Given the same request with soil-first priorities 1/5/1/1, when the engine recommends, then maíz con frijol → maicillo comes first.

## Plan

- Add the weighted score from Scoring v1: sum(priority × criterion) / sum(priority), on the clamped float criteria, never the rounded ones.
- Rank the alternatives by that score with the request's priorities instead of the equal-weight mean; the tie-break by template order stays.
- Expected orders come from hand computation on the real crops.csv and the stub templates (recorded in the test docstring).

## Out of scope

- `recommended` and "current already best" (#07), canícula (#04), reasons citing the top priority (#12).
- Golden water-first vs income-first test with a recommended option (#07, needs F1/F2 and `recommended`).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 02
