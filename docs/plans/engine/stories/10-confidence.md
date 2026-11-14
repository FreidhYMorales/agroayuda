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
