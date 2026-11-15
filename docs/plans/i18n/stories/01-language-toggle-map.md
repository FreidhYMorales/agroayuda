# Story 01: Language toggle on the map screen

## Story

01. As a visitor, I want to switch the map screen to English with a language toggle so that I can start the app in my language.

## Acceptance criteria

- [ ] Given the map screen in Spanish, when I tap the "EN" toggle, then every map-screen text (title, buttons, states, rain legend, source line, locate button) shows in English and the URL carries `lang=en`; tapping "ES" switches back.
- [ ] Given a URL with `lang=en`, when I open or reload it, then the map screen starts in English and the page language is English; with no `lang` or an unknown value it starts in Spanish.
- [ ] Given English is chosen, when I go to another step and come back (or use the browser's back button), then the map screen is still in English.

## Plan

- Add the language to the URL state, parsed and written like the other keys; Spanish is the default.
- Keep the map texts as one Spanish and one English set; the map screen picks the set from the current language.
- Put a small ES / EN toggle in the map header that updates the URL state.
- Set the page's language attribute from the current language.

## Out of scope

- Texts outside the map screen (risks, form, comparison, detail): stories 02-06.
- Texts that come from the API (risk explanations, `name_es` fields): stories 03 and 05.
- Demo place names: they are proper nouns and stay as they are.
- Browser language detection: not in the backlog.
- Any i18n library (no new dependencies).

## Suggestions (your call)

- Assumption: I draft the English copy (short, plain, same tone as the Spanish) and you review it in the PR.

## Size

small
Risk: none

## Log

- L1 request: /flow:story 01
- L2 approved; built with /flow:pair 01 in mode B on branch `story/01-language-toggle-map`.
- L3 evidence: commits 8512377..04a35d7 (6 test/feat pairs plus one pinning test). Extra step outside the approved list: summary card and source detail got their own test (a66db45 → 052449c) to keep steps within 3 files. The "kept across steps" test passed on first run (the URL merge already kept `lang`); a mutation dropping `lang` in the patch made it fail, so it is not a trivial green. `make check` exit 0; web `Tests 347 passed (347)`.
- L4 interruption: a peer session left uncommitted comment translations in this working tree; they were byte-identical to its own worktree (`AgroAyuda-fixes`), so they were restored here and only this story's hunks were committed.
- L5 manual check: user reviewed the ES/EN toggle at phone width in the running app: OK.
- Risk: none
