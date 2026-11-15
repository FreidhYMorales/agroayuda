# Story 17: What each option improves

## Story

17. As a farmer, I want one line naming what each option improves over my rotation so that I see its benefit. Requires: #08

## Acceptance criteria

- [ ] Given Chiquimula (example site), maíz → frijol, when the engine recommends, then frijol → maicillo has `benefits` ["Mejora frente a su rotación en: agua y riesgo."] and maíz con frijol → maicillo has ["Mejora frente a su rotación en: suelo."].
- [ ] Given current maíz → none (rounded 4/1/2/1), when frijol → maicillo (5/3/3/2) is compared, then its line lists all four: "Mejora frente a su rotación en: agua, suelo, ingreso y riesgo.".
- [ ] Given any request, when the engine recommends, then the current option has no benefits line, and an alternative that improves nothing (canavalia → maicillo against current gandul → maicillo, same tiers) has none either.

## Plan

- The line lists the criteria whose delta is "better" (#08), in the order agua, suelo, ingreso, riesgo, joined Spanish-style ("a y b", "a, b y c").
- A higher risk score means less risk, so "riesgo" in the list reads as an improvement, like the other criteria.
- No "better" delta (always the case for the current option) means an empty `benefits` list rather than a filler line.
- Copy (Spanish, usted) lives in the engine's texts module, approved in this story.

## Out of scope

- Benefits from the low-SOC rule (#09), longer multi-line texts (SHOULD 0), UI.

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 17
- L2 user approved the story and the copy ("Mejora frente a su rotación en: {lista}.", empty list when nothing improves).
- L3 test list approved; mode B (small, Risk: none).
- L4 commits: c985889 -> a84348a (benefits line, " y " join), 18d7368 -> 5a0f23c (commas for 3+ items), 5799704 -> 7649473 (empty list when nothing improves; the planned "always write a line" mutant was not needed: the test was red against a real bug, a broken "...en: ." line). Every test was red before its code.
- L5 make check green: 182 passed (Python), web green. No verifier (Risk: none).
- Risk: none
