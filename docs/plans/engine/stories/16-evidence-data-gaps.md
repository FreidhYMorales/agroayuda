# Story 16: NASA evidence and the data we do not have

## Story

16. As a farmer, I want NASA evidence and the data that is missing for each option so that I know what the advice rests on. Requires: #10

## Acceptance criteria

- [ ] Given the example site (canícula share 0.7 of 1991-2020), when the engine recommends, then every option has one evidence item: dataset "NASA POWER", value "21 de 30 años", text the site's canícula explanation; and a site with no canícula share gets no evidence item.
- [ ] Given maíz → frijol on a site with full soil, when the engine recommends, then its `data_gaps` is only "La lluvia de NASA POWER es una estimación regional."; on the null-soil site it also starts with "No hay datos de suelo para este punto."
- [ ] Given ayote → frijol, when the engine recommends, then its `data_gaps` includes "Ayote: valor general, validar localmente." (ayote has no local source).

## Plan

- Evidence (NASA POWER canícula share): value = share × 30 years, rounded, written "N de 30 años" as the spec's UI example; text = the canícula risk's own `explanation_es` (written by the data owner), so the engine adds no new claim.
- Data gaps, in this order: missing soil line, one line per non-local crop (primera, then postrera; `none` never), then the POWER regional-estimate line, which always applies.
- Copy (Spanish, usted) lives in the engine's texts module, approved in this story.

## Out of scope

- SoilGrids SOC evidence (#09, waits for the cited low-SOC threshold), "suelo no incluido en esta versión" (only if soil is cut), benefits (#17).

## Suggestions (your call)

- None.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 16
- L2 user approved the story and the copy (soil gap line, non-local crop line).
