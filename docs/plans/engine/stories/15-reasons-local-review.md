# Story 15: Why this option, and check with a technician

## Story

15. As a farmer, I want one line saying how each option does on my top priority, and a reminder to check with a local technician, so that I understand and verify the advice. Requires: #13

## Acceptance criteria

- [ ] Given water-first priorities 5/3/3/3 at Chiquimula, maíz → frijol, when the engine recommends, then each option's `reasons` is one line "Su prioridad es cuidar el agua: esta opción saca N de 5.", with N its rounded water score (4, 5, 4).
- [ ] Given tied top priorities, when the line is written, then the tie breaks water > soil > income > risk: 4/4/2/2 names "cuidar el agua", 1/4/4/1 names "cuidar el suelo", and income-first 1/1/5/1 names "el ingreso".
- [ ] Given any request, when the engine recommends, then every option's `local_review` is one line "Consulte con un técnico local antes de cambiar su siembra.".

## Plan

- Top priority = the highest of the four priorities; ties break in the spec order water > soil > income > risk.
- Labels (Spanish, usted): water "cuidar el agua", soil "cuidar el suelo", income "el ingreso", risk "bajar el riesgo"; N is the option's rounded score on that criterion (the number on screen).
- The `local_review` line is the same for every option.
- Copy lives in the engine's texts module (work package file list), one constant per line.

## Out of scope

- Evidence and data gaps (#16), benefits (#17), SoilGrids evidence (#09), longer multi-line texts (SHOULD 0).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 12
- L2 user approved splitting 12 into #15 (this story), #16 (evidence, data gaps) and #17 (benefits). The Spanish copy in the criteria is proposed here for the user's approval.
- L3 user approved the story and the Spanish copy (labels, reasons and local_review lines).
- L4 test list approved; mode B (small, Risk: none).
- L5 commits: 29e7d55 -> 316d3c6 (reasons line, water only), a9a07be -> e8518d2 (labels and tie order water > soil > income > risk), bd18107 -> fe36c22 (local_review on every option). Every test was red before its code.
- L6 make check green: 174 passed (Python), web green. No verifier (Risk: none).
- Risk: none
