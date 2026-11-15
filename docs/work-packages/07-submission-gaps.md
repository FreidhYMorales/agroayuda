# Work package 07: Docs — submission gaps

Owner: ________ · Estimate: 1-2 hours · Due: H35 (Sun 19:00), before the final project-page save; docs only, so it is safe after the H28.5 (Sun 12:30) freeze · Depends on: nothing

## Paste this at the top of your AI chat

> You are helping me write documentation for the work package below. Only edit the files listed under "Files to deliver".
> Every claim must match the repository or what the owners tell you; never invent tools, names or licences.
> Write in English, short plain sentences. If a fact seems wrong or missing, tell me instead of guessing.

## Context

AgroAyuda is a phone-first web app (Spanish, Guatemala) that helps farmers in Guatemala's Dry Corridor compare their crop rotation with two alternatives, using NASA POWER data (NASA Space Apps 2026, "Field Shift: Adapting Farms with NASA Data"). Before the final project-page save, a few required fields are still empty. This package fills them. It does not change the app.

## Scope

- In: the two empty rows of `docs/si-usage.md`; the OpenFreeMap licence and the two AI-tool rows in `docs/resources.md`; the "Members" line in `docs/submission.md`.
- Out of scope: any code; any text about other regions or scaling (planned after the event); the demo video link (package 08 hands it over).

## Steps

1. **SI usage.** In `docs/si-usage.md`, the rows "`engine/`" and "`web/` map and risks" say `_fill in_`. Ask those two owners which AI tool they used and for what, and write their answer in the same style as the other rows. Space Apps requires this disclosure; do not guess it.
2. **OpenFreeMap licence.** In `docs/resources.md`, the OpenFreeMap row says `_verify_`. Read the licence on https://openfreemap.org/ and write what it says (tiles and the OpenStreetMap data, ODbL). If the page is unclear, tell the lead.
3. **Members.** In `docs/submission.md`, replace `Members: TODO` with the team names (ask the lead).
4. **AI tools in the resource list.** In `docs/resources.md` ("Tools and services"), two rows say `_fill in_`: the AI voice tool (ask the package 03 owner which tool made the English voice-over, and its URL) and "Other AI tools used by owners" (one row per tool named in `docs/si-usage.md` after step 1, e.g. ChatGPT or GitHub Copilot, with its URL; delete the placeholder row when done).

## Files to deliver

| Path | Purpose |
|---|---|
| `docs/submission.md` | "Members" line |
| `docs/si-usage.md` | The two `_fill in_` rows, with the owners' answers |
| `docs/resources.md` | OpenFreeMap licence instead of `_verify_`; the AI voice tool and other AI tools rows |

## Checks

- No `_fill in_`, `_verify_` or `Members: TODO` left in a table row or the Members line (`rg -n "^\|.*(_fill in_|_verify_)|Members: TODO" docs --glob '!docs/work-packages/**'` prints nothing).
- `make check` green (docs do not break it, but CI must pass before merge).

## Conventions

- English, short plain sentences.
- Branch `docs/submission-gaps`, conventional commits (`docs(submission): fill members`, `docs(si): fill engine and map rows`), no AI attribution. PR with 3 lines: done, not done, surprises.
- If you use AI for this, add it to your row in `docs/si-usage.md`.

## Done when

- [ ] `docs/si-usage.md` and `docs/resources.md` have no `_fill in_` or `_verify_` rows; "Members" is filled
- [ ] PR merged before 18:00 so the lead can paste the final fields by 19:00

## Coordination

- Lead: approves the PR; gives the team names.
- Engine owner and web-map owner: answer step 1.
- Package 03 owner: names the AI voice tool (step 4).
- Package 08 owner: gives the demo video link for `docs/submission.md` (they edit only that line, or send it to you).
