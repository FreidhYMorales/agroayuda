# Story 03: Site risks in English

## Story

03. As a visitor, I want the site risks explained in English so that I understand my plot's conditions.

## Acceptance criteria

- [ ] Given English is chosen, when I open the risks screen, then its header, close button, "no strong risk" message, retry button and continue button are in English.
- [ ] Given English is chosen, when the risks are shown, then each row's title with its level, its period (English months, "mid", "(estimated)") and its source line ("Data: …", "in 12 of 30 years", the soil sample note) are in English.
- [ ] Given English is chosen and the site has a high risk, when I look at the map summary card, then its ⚠ risk line is in English; in Spanish every risk text stays as it is today.

## Plan

- The risks screen already builds every visible text in the web app from the risk's id, level, months and value; give those texts a Spanish and an English version chosen by the current language, as on the map and the form.
- The map summary card uses the same English risk title.
- No contract, API or engine change: the screen never shows `explanation_es`.

## Out of scope

- `explanation_es` and any `*_en` field on the site risk contract (the web does not show it).
- The bare-field line on the option detail screen: story 05.
- Errors shown outside the risks screen: story 06.

## Suggestions (your call)

- Assumption: I draft the English and you review it in the PR. Titles keep the local word so it matches the map and the data: "Strong dry spell (canícula)", "Moderate dry spell (canícula)", "Mild dry spell (canícula)"; "Bare field · high / moderate / low"; "Strong heat", "Moderate heat", "Mild heat"; "❔ Soil: no data". Months: Jan…Dec; "mid Jul-Aug"; "(estimated)"; "Data: NASA POWER · in 12 of 30 years"; "sample near the center of the zone".

## Size

small
Risk: none

## Log

- L1 request: /flow:story 03
- L2 finding: the risks screen never shows `explanation_es`; titles, periods and source lines are built in the web from structured fields, so the English version needs no contract change.
- L3 approved; built with /flow:pair 03 in mode B on branch `story/03-risks-english`.
- L4 evidence: 6 test/feat pairs, 3257820..ce89191. `risksCopy(lang)`; `riskTitle`, `riskPeriod`, `riskSourceLine` take `lang` with `"es"` as default, so existing tests stayed untouched. The temporary `RISKS_COPY` alias was removed once unused. No contract, API or engine change. `make check` exit 0; web `Tests 374 passed (374)`.
- L5 manual check: user reviewed the English risks screen at phone width in the running app: OK.
- Risk: none
