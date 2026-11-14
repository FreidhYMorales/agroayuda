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
