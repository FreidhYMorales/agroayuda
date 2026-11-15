# Story 13: Recommend an option only when it is worth changing

## Story

13. As a farmer, I want one option marked recommended only when it passes the canícula check and beats my current rotation so that I know if changing is worth it. Requires: #02, #05

## Acceptance criteria

- [ ] Given Chiquimula (example site, canícula high), maíz → frijol and default priorities, when the engine recommends, then frijol → maicillo is slot 1 and the only option with `recommended` true (3.125 > current 2.875).
- [ ] Given the same request with soil-first priorities 1/5/1/1, when the engine recommends, then frijol → maicillo (passes, 2.8125) is slot 1 and recommended, ahead of maíz con frijol → maicillo (fails F2, 3.1875), which is slot 2.
- [ ] Given income-first priorities 1/1/5/1 (current 3.4375 beats frijol → maicillo 3.0625), or a set of templates where no alternative passes, when the engine recommends, then no option has `recommended` true and both alternatives are still shown.

## Plan

- Selection from the spec: slot 1 = best passing alternative (if any); slot 2 = best remaining template, passing or not; if none passes, the top 2 by score.
- `recommended` is true only for slot 1, only if it passes and its weighted score is strictly greater than the current's; never for the current.
- Ties keep template order (already pinned); scores are the float weighted scores from #02.
- Expected values are hand-computed on the real crops.csv and the stub templates (recorded in the test docstrings).

## Out of scope

- The golden water-first vs income-first test on the real templates (#14, needs package 04's `rotation_templates.csv`).
- Irrigation (#06), deltas (#08), the UI message "Su rotación actual ya es la mejor" (web).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 07
- L2 user approved splitting 07 into #13 (this story) and #14 (golden on the real templates, blocked on package 04).
- L3 test list approved; mode B (small, Risk: none). User approved moving story 02's water-first and soil-first tests to a low-canícula copy of the site (c91b162; expected orders unchanged, docstrings exact again).
- L4 commits: 40aaf66 -> 970264d (recommend slot 1 when it passes and beats the current), e7074d7 -> 207d950 (best passing alternative takes slot 1), then one test commit for "current scores best" and "nothing passes" (green on first run; proven by mutants: ignore the current's score, recommend a failing slot 1).
- L5 make check green (Python and web). No verifier (Risk: none).
- Risk: none
