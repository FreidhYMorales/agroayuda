# Story 05: Option detail in English

## Story

05. As a visitor, I want each option's reasons, benefits, NASA evidence, data gaps and local review in English so that I understand why it is recommended.

## Acceptance criteria

- [ ] Given English is chosen, when I open an option's detail, then the back link, the crop sequence, "Compared with current" with each criterion's better/same/worse, the confidence line, the bare-months line, every section title and the crop-values note are in English.
- [ ] Given English is chosen, when the options load, then each option's reasons, benefits, local review and data gaps (including crop names) are in English, and so is the reason after "not recommended" / "⚠ Current:" on the comparison screen.
- [ ] Given English is chosen and the site has a canícula share, when I read "Evidence (data)", then its text and its value (e.g. "1 of 30 years") are in English and still name NASA POWER and MERRA-2; in Spanish every detail and engine text stays exactly as it is today.

## Plan

- Contract: additive English siblings on each option (`reasons_en`, `benefits_en`, `data_gaps_en`, `local_review_en`, `not_recommended_reason_en`) and on evidence (`text_en`, `value_en`); Spanish fields unchanged; schema, examples and the generated web types follow.
- Engine: builds the English texts next to the Spanish ones in the same call; the English evidence is built from the canícula level and share already in the site risk, not from the stored Spanish text.
- API: passes the new fields through; no `lang` parameter.
- Web: the detail screen gets a Spanish and an English set of texts by the current language, and shows the `*_en` fields when English is chosen.

## Out of scope

- `explanation_en` on `SiteRisk`, any Parquet or pipeline change, any data regeneration.
- Crop catalog changes (`name_en` in the CSV).
- Loading, error and empty states: story 06.

## Suggestions (your call)

- Assumption: the engine keeps its own crop id → English name table, with the same names the form shows (no catalog change).
- Assumption: I draft the English and you review it in the PR, e.g. "Your top priority is saving water: this option scores 4 of 5.", "Better than your rotation in: water and soil.", "Talk to a local technician before changing what you plant.", "Pigeon pea: general value, check locally.", "NASA POWER rain is a regional estimate.", "Needs a lot of water right in the canícula", "Few long dry spells in July and August. There was a long dry spell in 1 of 30 years (1991-2020). NASA POWER rain is a regional estimate (MERRA-2 model), not a measurement on your plot."

## Size

normal
Risk: item 3 (RecommendationResponse gains *_en fields)

## Log

- L1 request: /flow:story 05
- L2 finding: detail texts come from the engine (`texts.py`, `scoring.py`) and the evidence from `explanation_es` stored in the Parquet; user chose to build the English evidence in the engine at request time, with no Parquet change.
- L3 approved by the user.
