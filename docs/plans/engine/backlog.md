# Backlog: engine

## Context

- What: the rotation engine of work package 02: given the site, the current rotation, the priorities and irrigation, it returns 3 scored options (current + 2 alternatives) for farmers in Guatemala's Dry Corridor. Plan: docs/work-packages/02-engine.md (Render is out; the lead took it).
- Stack: Python 3.13, stdlib + pydantic + `contracts` only; no I/O in `engine/src/`.
- Expensive decisions: none (contracts are frozen).
- Test command: make check
- Single test: uv run pytest <file>

## Backlog

01. [x] 300aadf As a farmer, I want to enter my current rotation and see it next to two alternatives scored on water, soil, income and risk so that I can compare them.
02. [x] 95ca738 As a farmer, I want my priorities to change how the alternatives rank so that the comparison fits what matters to me. Requires: #01
03. [x] e9dfe1c As a farmer, I want to see which months each option leaves the field bare, and lose soil points at 6+ months, so that I see the erosion cost. Requires: #01
04. [x] 2678b1b As a farmer, I want the canícula at my site to lower the risk of primera crops so that the options reflect the dry spell. Requires: #01
05. [x] e9ae637 As a farmer, I want a warning on options that fail in the canícula (F1/F2) so that I do not plant something likely to be lost. Requires: #04
06. [x] e2ab82e As a farmer with irrigation, I want high-water crops to gain risk points and lose the canícula warnings so that my irrigation counts. Requires: #05
07. [-] split → #13, #14
08. [x] 1537931 As a farmer, I want better/same/worse arrows versus my current rotation so that differences are clear at a glance. Requires: #01
09. [ ] As a farmer on low-carbon soil, I want nitrogen-fixing crops to earn extra soil points with SoilGrids evidence so that the soil advice fits my plot. Requires: #01
10. [x] 3e9bc5e As a farmer, I want a confidence level per option so that I know how much to trust it. Requires: #01
11. [x] 561d7c9 As a farmer who edited the link, I want a clear error when a crop is in a season it does not support so that I am not shown nonsense. Requires: #01
12. [-] split → #15, #16, #17
13. [x] 6bc3ccd As a farmer, I want one option marked recommended only when it passes the canícula check and beats my current rotation so that I know if changing is worth it. Requires: #02, #05
14. [ ] As a farmer, I want water-first and income-first priorities to recommend different rotations at Chiquimula on the real templates so that my priorities visibly matter. Requires: #13
15. [x] fe36c22 As a farmer, I want one line saying how each option does on my top priority, and a reminder to check with a local technician, so that I understand and verify the advice. Requires: #13
16. [ ] As a farmer, I want NASA evidence and the data that is missing for each option so that I know what the advice rests on. Requires: #10
17. [ ] As a farmer, I want one line naming what each option improves over my rotation so that I see its benefit. Requires: #08
