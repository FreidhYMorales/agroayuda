# Story 10: How much to trust each option

## Story

10. As a farmer, I want a confidence level per option so that I know how much to trust it. Requires: #01

## Acceptance criteria

- [ ] Given a site with full soil data, when maíz → frijol (both local sources) is rated, then confidence is "high"; and none → ajonjolí is "medium" (one non-local crop; fallow does not count).
- [ ] Given a site with full soil data, when ayote → ajonjolí (two non-local crops) is rated, then confidence is "low".
- [ ] Given the null-soil example site, when maíz → frijol is rated, then confidence is "medium", and ayote → frijol is "low" (null soil plus one non-local crop).

## Plan

- Spec rule: factors = 1 if any of the site's soil fields is null, plus 1 per non-`none` crop in the option with `local_source` false; 0 → high, 1 → medium, 2 or more → low.
- Every option gets its own confidence (current and alternatives), replacing the "high" placeholder from #01.
- If every option comes out low, that is the honest result; crop values are never tuned to change it.
- Tests use the real crops.csv (ajonjolí and ayote are the non-local crops today) and both example sites.

## Out of scope

- The bare-field estimate (never a factor), data-gap texts (#12), UI highlighting of low confidence (web).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 10
- L2 test list approved; mode B (small, Risk: none).
- L3 commits: a92cdb0 -> 43ea64a (fake "medium"), ee8942e -> 4ff2435 (real factor count; the missing-soil factor was written here, ahead of its test), one test commit for "fallow never counts" (test-built non-local none, since the real none row is local) and "missing soil adds one" (green on first run; proven by mutants "none counts" and "ignore missing soil"), 5b603de + 2fffb82 -> 32cfbf5 (confidence on every option).
- L4 deviation: 5b603de was committed with missing imports (a multi-line sd did not match and `;` let the commit through), so its first failure was a NameError, not red for the right reason; 2fffb82 fixed only the imports, then the real red ("high" vs "medium") was shown before the code.
- L5 make check green (Python and web). No verifier (Risk: none).
- Risk: none
