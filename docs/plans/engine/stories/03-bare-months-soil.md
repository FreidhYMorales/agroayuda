# Story 03: Long bare periods cost soil points

## Story

03. As a farmer, I want to see which months each option leaves the field bare, and lose soil points at 6+ months, so that I see the erosion cost. Requires: #01

## Acceptance criteria

- [ ] Given frijol → none (bare Aug-Apr, 9 months), when it is scored, then soil is 1.5 instead of 2 (mean of frijol 3 and fallow 1, minus 0.5).
- [ ] Given gandul → none (gandul covers May-Oct, bare Nov-Apr: exactly 6 months), when it is scored, then soil is 2.5 instead of 3 (the threshold counts 6).
- [ ] Given maíz → frijol (bare Dec-Apr, 5 months), when it is scored, then soil stays 2.5 (no penalty below 6).

## Plan

- Scoring v1 "Bare months" row: after combining the seasons, soil loses 0.5 when the option leaves 6 or more months bare; the 1-5 clamp still applies after it.
- Bare months come from the season calendar already shown on every option (#01 moved them there), so the list on screen and the penalty always agree.
- Expected values are hand-computed from crops.csv (`cycle_days`) and the calendar (recorded in test comments).
- Hand check of existing tests: none of their hand-computed options has 6+ bare months, except none → none and none → maicillo, whose asserted values do not change (soil clamps to 1, or only risk is asserted).

## Out of scope

- The `bare_field` site risk (data owner's `risks.py`), texts about bare months (#12).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 03
