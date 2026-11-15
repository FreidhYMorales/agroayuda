# Story 04: Comparison screen in English

## Story

04. As a visitor, I want the comparison screen and its badges in English so that I can compare the options.

## Acceptance criteria

- [x] Given English is chosen and the options have loaded, when I look at the table, then the back link, the column titles (Current, Opt. 1, Opt. 2), each column's crop sequence (e.g. "Pigeon pea → Nothing"), the row labels (Water, Soil, Income, Risk, Confidence, Months without a crop) and the confidence words (high, medium, low) are in English.
- [x] Given English is chosen, when an option is recommended, not recommended or the current one has a warning, then the badge notes above the table and the "no option is better" summary are in English (e.g. "✓ Recommended: Opt. 1 (Pigeon pea → Nothing)", "✗ Opt. 2 not recommended: …").
- [x] Given English is chosen, when I look below the table, then "Tap an option ›", the "this is an aid" note and "Change priorities" are in English; in Spanish every comparison text stays as it is today.

## Plan

- Give the comparison texts a Spanish and an English set chosen by the current language, as on the other screens.
- Crop sequences reuse the English crop names added for the form.
- Badge and summary words take the language; the reason after "not recommended" is shown as the API sends it.

## Out of scope

- The reason text after "not recommended" / "⚠ Current:": it comes from the engine (`not_recommended_reason`), so its English is story 05 with the other engine texts. Until then it stays Spanish.
- The option detail screen (titles, deltas, reasons, benefits): story 05.
- Loading, slow, error and retry texts, and the notices above the form: story 06.

## Suggestions (your call)

- Assumption: I draft the English and you review it in the PR: "← Your options", "Current" / "Opt. 1" / "Opt. 2", "Water", "Soil", "Income", "Risk", "Confidence", "Months without a crop", "●●● high", "✓ Recommended: …", "✗ Opt. 2 not recommended: …", "⚠ Current: …", "Your current rotation is already the best for your priorities", ", but watch out for the canícula", "Tap an option ›", "ⓘ This is an aid; it does not replace your judgment", "Change priorities".

## Size

small
Risk: none

## Log

- L1 request: /flow:story 04
- L2 finding: `not_recommended_reason` is Spanish text built by the engine, so its English needs the `*_en` contract field; it moves to story 05.
- L3 done: make check green; criteria 1-3 covered by ComparisonScreen and badges tests.
