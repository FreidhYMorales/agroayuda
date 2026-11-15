# Story 06: Irrigation counts

## Story

06. As a farmer with irrigation, I want high-water crops to gain risk points and lose the canícula warnings so that my irrigation counts. Requires: #05

## Acceptance criteria

- [ ] Given a high-water crop (test-built: none in crops.csv today), when the same option is scored with irrigation instead of without, then its risk rises by 1 and its water score does not change.
- [ ] Given canícula high and a high-water primera crop, when the option is checked with irrigation, then it carries no reason (F1 off).
- [ ] Given Chiquimula (canícula high), maíz → frijol with irrigation, when the engine recommends, then no option carries a canícula warning (F2 off) and all 3 options are still shown.

## Plan

- Scoring v1: with irrigation, a crop whose water need is high gets +1 risk, in whichever season it is; "water" means water saved, so irrigation never raises it.
- The +1 is added per crop before the season combination and the 1-5 clamp; the canícula penalty still applies (both rules stack).
- With irrigation, F1 and F2 never fire.
- Expected values are hand-computed (recorded in the test docstrings).

## Out of scope

- Any other effect of irrigation (water criterion, texts in #12), deltas (#08), UI.

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 06
- L2 test list approved; mode B (small, Risk: none).
- L3 commits: 06180a0 -> 63f2919 (+1 risk for high-water crops with irrigation, water unchanged), 531c1d1 (low-water crop unchanged; green on first run, proven by a "+1 for every crop" mutant), f70e5eb -> 0a81c4b (irrigation turns off F1/F2), then one test commit for Chiquimula with irrigation (green on first run, proven by an "ignore irrigation in recommend" mutant).
- L4 the make check gate caught an unformatted source line before the 63f2919 commit (fixed with ruff format, no commit with a failing check).
- L5 make check green (Python and web). No verifier (Risk: none).
- Risk: none
