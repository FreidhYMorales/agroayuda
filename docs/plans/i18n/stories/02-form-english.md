# Story 02: Form screen in English

## Story

02. As a visitor, I want the form screen in English, including crop names, so that I can enter my current rotation.

## Acceptance criteria

- [ ] Given English is chosen, when I open the form, then its texts are in English: back link, primera and postrera questions, the priorities question and its four rows, the irrigation question with Yes / No, and the submit button.
- [ ] Given English is chosen, when the crops load, then every crop button shows its English name, "Nada" included (e.g. "Maicillo" reads "Sorghum").
- [ ] Given English is chosen, when the crops fail to load or are still loading, then the error message, its retry button and the loading text are in English; in Spanish everything stays as it is today.

## Plan

- Give the form texts a Spanish and an English set, chosen by the current language, the same way as the map screen.
- English crop names live in the web app, keyed by crop id, next to the Spanish names it already keeps for the comparison; the form shows them instead of the catalog's Spanish name when English is chosen.
- The catalog file, its contract and the crop CSV stay untouched.

## Out of scope

- Crop names on the comparison and detail screens: story 04 (it can reuse the same English names).
- Notices the results flow shows above the form (e.g. "Revise sus respuestas"): story 06.
- Any change to the catalog contract, `crops.json` or `data/catalog/crops.csv`.

## Suggestions (your call)

- Assumption: I draft the English copy and crop names (maicillo → sorghum, gandul → pigeon pea, mucuna → velvet bean, canavalia → jack bean, ajonjolí → sesame, ayote → squash) and you review them in the PR.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 02
- L2 decision: English crop names are kept in the web app by crop id, not as a `name_en` contract field (closed enum, already translated in the web for the comparison).
- L3 approved; built with /flow:pair 02 in mode B on branch `story/02-form-english`.
- L4 evidence: 5 test/feat pairs (first test commit after 025fe35's parent through 0897032). Test 1 first failed on a missing module, so an empty `formCopy` skeleton was added to get a real assertion failure. Test 4 was corrected before its commit: crop icons are `aria-hidden`, so accessible names carry no icon. The unused `RETRY_LABEL` export in the form was removed with step 5. `make check` exit 0; web `Tests 361 passed (361)`.
- L5 manual check: user reviewed the English form at phone width in the running app: OK.
- Risk: none
