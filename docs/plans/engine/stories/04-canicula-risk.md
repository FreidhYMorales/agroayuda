# Story 04: The canícula lowers the risk of primera crops

## Story

04. As a farmer, I want the canícula at my site to lower the risk of primera crops so that the options reflect the dry spell. Requires: #01

## Acceptance criteria

- [ ] Given a site with canícula high, when frijol → maicillo is scored, then risk is 2 (frijol in primera loses 1 from 3; maicillo in postrera keeps 5).
- [ ] Given the same rotation, when the site's canícula is medium, then risk is 2.5 (half penalty), and when it is low, unknown or missing, then risk stays 3.
- [ ] Given canícula high, when none → maicillo is scored, then risk stays 5 (fallow is exempt), and when maíz → frijol is scored, then risk is clamped to 1 (maíz 1 - 1 = 0).

## Plan

- Read the canícula level from the site's risks; the penalty applies only to the primera crop's risk (the canícula falls in the primera cycle).
- High subtracts 1, medium 0.5; low, unknown or no canícula risk subtract nothing; the `none` row is exempt.
- The existing season combination (min) and clamp to 1-5 stay; criteria are asserted as floats from score_option.
- One existing assertion changes: story 01's Chiquimula test expects frijol → maicillo risk 3 on the example site, whose canícula is high; with this rule it becomes 2. Every other existing test keeps its values (hand-checked: the worked example and maíz-led rotations already clamp to 1; the water-first, soil-first, tie and every-rotation orders do not change).

## Out of scope

- F1/F2 failure reasons (#05), irrigation (#06), `recommended` (#07), evidence texts citing the canícula (#12).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 04
- L2 user approved changing story 01's Chiquimula test expectation for frijol → maicillo risk from 3 to 2.
- L3 test list approved; mode B (small, Risk: none).
- L4 commits: ea5fd03 (test high + story 01 expectation 3 -> 2) -> 2dd19b4 (high penalty), e41fe4e -> 867c95f (medium), then one test commit for low/unknown/missing, fallow exemption and lower clamp (green on first run, each proven by a mutant: penalize low/unknown, drop the fallow exemption, drop the lower clamp).
- L5 a mypy error (Level | None key) was caught by the make check gate before committing and fixed: a missing canícula risk reads as "unknown".
- L6 make check green (Python and web). No verifier (Risk: none).
- Risk: none
