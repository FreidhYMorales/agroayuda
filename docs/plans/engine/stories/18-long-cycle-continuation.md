# Story 18: A long-cycle crop is not fallow in postrera

## Story

18. As a farmer choosing a long-cycle crop (gandul, canavalia) with "Nada" in postrera, I want the engine to treat postrera as that crop still in the field, not fallow, so that its soil benefit is not halved. Requires: #03

## Acceptance criteria

- [ ] Given gandul → none (gandul 180 d covers May-Oct, so it is still in the field at the September postrera planting), when it is scored, then soil is 4.5 instead of 2.5 (mean of gandul 5 and gandul 5, minus 0.5 for the 6 bare months Nov-Apr) and water, income and risk do not change.
- [ ] Given maíz → none (maíz 120 d covers May-Aug and is gone by September), when it is scored, then postrera still scores as fallow (`none` row) and its values do not change.
- [ ] Given gandul → none, when the option is returned, then its bare months stay Nov-Apr (6), the same as before this story.

## Plan

- Scoring v1 gets one new rule: when postrera is `none` and the primera crop still covers the postrera planting month (from the season calendar and `cycle_days`), the postrera season uses the primera crop's per-crop row instead of the `none` row; the canícula penalty stays on primera only.
- The bare-months list and the 6+ months soil penalty are unchanged: Nov-Apr really is bare.
- `docs/spec.md` Scoring v1 table gets the new row in the same change, so the spec and the engine agree.
- Expected values are hand-computed from `crops.csv` (gandul and canavalia: water 5, soil 5, income 1, risk 5) and recorded in test comments; the story 03 gandul → none test changes from 2.5 to 4.5 on purpose, with this story cited.
- Hand check of the other engine tests for any option with a 180-day primera and `none` postrera before changing code.

## Out of scope

- A long-cycle primera followed by a real postrera crop (e.g. gandul → maicillo overlapping in the field); that is a season-validity rule, not this story.
- Texts that mention "descanso" or fallow for these options, crop values in `crops.csv`, and the rotation templates (PR #38).
- Any change to the contracts or to `bare_months`.

## Suggestions (your call)

- Assumption to confirm: the 6+ bare months penalty still applies (Nov-Apr is bare), so soil is 4.5 (shown as 5), not 5.

## Size

small
Risk: none

## Log

- L1 request: si, armalo como historia del motor
