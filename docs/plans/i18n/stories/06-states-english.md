# Story 06: Loading and error states in English

## Story

06. As a visitor, I want errors, loading and empty states in English so that I am never left with Spanish-only messages.

## Acceptance criteria

- [ ] Given English is chosen, when the options are loading, then the screen reader hears "Loading the options…" and, if the server is slow, I see "Waking up the server, one moment…".
- [ ] Given English is chosen, when the options cannot be loaded, then I see "We could not get your options." and a "Try again" button (no button when the place has no data, as today).
- [ ] Given English is chosen, when the answers are rejected by the server, then the form shows "Check your answers"; in Spanish every loading, error and notice text stays as it is today.

## Plan

- The comparison screen's loading, slow, error and retry texts join its existing Spanish and English set, chosen by the current language.
- The "check your answers" notice above the form is chosen by the current language when it is set.
- No contract, API or engine change.

## Out of scope

- The "outside the region" notice from the results flow: the app does not show it today (the map shows its own English outside-region message since story 01).
- Map, form and risks error, slow and retry texts: already in English (stories 01-03).
- The API's `detail` error text: the web never shows it.

## Suggestions (your call)

- Assumption: the slow message reuses the map's English wording, "Waking up the server, one moment…"; the Spanish stays "Despertando el servidor…" as today.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 06
- L2 finding: map, form and risks states are already bilingual; only the comparison loading/slow/error/retry texts and the form's invalid-request notice are Spanish-only. The results flow's outside-region notice is never shown (no caller passes `onBackToMap`).
- L3 approved by the user.
