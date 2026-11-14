# Story 08: Better, same or worse than my rotation

## Story

08. As a farmer, I want better/same/worse arrows versus my current rotation so that differences are clear at a glance. Requires: #01

## Acceptance criteria

- [ ] Given Chiquimula (example site, canícula high), maíz → frijol and default priorities, when the engine recommends, then the current option shows "same" on every criterion.
- [ ] Given the same request, when the alternatives are compared with the current (rounded 4/3/4/1), then frijol → maicillo (5/3/3/2) shows water better, soil same, income worse, risk better, and maíz con frijol → maicillo (4/4/3/1) shows water same, soil better, income worse, risk same.
- [ ] Given an alternative whose soil is 3.0 while the current's is 2.5 (ayote → frijol), when they are compared, then soil is "same", because both round to 3 and the arrows must agree with the bars.

## Plan

- Deltas come from the rounded integer criteria (the numbers on screen), never the floats: higher is better, lower is worse, equal is same.
- The current option compares with itself, so it is always "same".
- Expected values are hand-computed from crops.csv on the example site (recorded in the test docstrings).

## Out of scope

- UI arrows and copy (web), texts (#12), confidence (#10).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 08
