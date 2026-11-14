# Story 05: Warnings for options that fail in the canícula

## Story

05. As a farmer, I want a warning on options that fail in the canícula (F1/F2) so that I do not plant something likely to be lost. Requires: #04

## Acceptance criteria

- [ ] Given canícula high and a primera crop with high water need, when the option is checked, then its reason is "Necesita mucha agua justo en la canícula" (F1).
- [ ] Given Chiquimula (example site, canícula high) and current maíz → frijol, when the engine recommends, then the current option and maíz con frijol → maicillo carry "Aguanta poco la sequía de la canícula" (F2, drought tolerance low), frijol → maicillo carries none, and all 3 options are still shown.
- [ ] Given canícula medium, low or missing, when the same options are checked, then no option carries a reason.

## Plan

- Add the failure check from the work package skeleton: canícula high plus the primera crop's water need high (F1) or drought tolerance low (F2); the postrera crop and `none` never fail.
- When both rules apply, F1's reason is the one shown (the spec lists F1 first).
- Fill `not_recommended_reason` on every option, the current one included; `recommended` stays false (that is #07); failures never remove a template.
- F1 uses a test-built crop: no crop in the real crops.csv has high water need today.

## Out of scope

- Irrigation disabling F1/F2 (#06), `recommended` and slot selection by passing options (#07), UI badges.

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 05
- L2 test list approved; mode B (small, Risk: none).
- L3 commits: 09e7601 -> 33324b3 (F1), 23b9509 -> 64c5fc5 (F2), one test commit for "F1 wins" and "no warning below high" (green on first run; proven by mutants: F2 checked before F1, warn on medium/missing), 5d54ff3 -> e1a05ca (warnings on every option via recommend).
- L4 make check green (Python and web). No verifier (Risk: none).
- Risk: none
