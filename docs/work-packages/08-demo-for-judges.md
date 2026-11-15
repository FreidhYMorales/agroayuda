# Work package 08: Demo — phone QA and English subtitles for international judges

Owner: ________ · Estimate: 3-4 hours · Due: QA report by 13:30; subtitles with the final video by 18:00 · Depends on: the screen recording (package 04, 12:30-15:30) and the English voice-over script (package 03)

## Paste this at the top of your AI chat

> You are helping me with the work package below. Only create or edit the files listed under "Files to deliver".
> Subtitles translate what the screen and the voice-over say; never add claims the app does not make.
> UI text stays in Spanish in the app; subtitles are English. If something seems wrong, tell me instead of guessing.

## Context

AgroAyuda is a phone-first web app in Spanish (Guatemala) for farmers in Guatemala's Dry Corridor (NASA Space Apps 2026). The judges are from other countries and may not read Spanish. The app stays in Spanish (its users are Guatemalan farmers), so the **demo video** must carry the meaning: an English voice-over (package 03) plus **English subtitles that also translate the Spanish on screen**. Before that, someone must walk the demo path on a real phone so the recording shows no bugs.

## Scope

- In: a phone QA pass on the live app with a short bug report; English subtitles (`.srt`) for the final video, synced to it; the subtitle upload on YouTube.
- Out of scope: fixing bugs (report them to the lead); the recording itself (package 04) and the voice-over (package 03); any change to the app or its Spanish copy.

## Part 1: phone QA (before 13:30)

On a real phone (not desktop resize), on https://agroayuda.vercel.app, in a private window:

| # | Path | Expected |
|---|---|---|
| 1 | Open the app cold (the API may be asleep) | "Despertando el servidor…" appears, then the map; no blank screen |
| 2 | Map opens framed on the region; tap Chiquimula in the demo-place list | Summary card for the zone |
| 3 | Risks screen | Each risk row has a level and one source line |
| 4 | Form: primera maíz, postrera maicillo, priorities 5/3/3/3, no irrigation, "Comparar opciones →" | Comparison with exactly 3 columns, badges, "Meses sin cultivo" |
| 5 | Tap the recommended option | Detail list with "Por qué:", "Evidencia (datos):" naming the dataset |
| 6 | "Cambiar prioridades" → 1/1/5/1, then primera maíz, postrera frijol | Form keeps answers; new comparison |
| 7 | Demo point "Ciudad de Guatemala (fuera de la región)" | "Por ahora solo cubrimos el Corredor Seco" |
| 8 | Reload the page on the comparison screen | Same answers come back (they live in the URL) |
| 9 | Rotate the phone; zoom the text in the phone settings | Nothing cut off; buttons still tappable |

Write the result in `docs/qa/phone-check.md`: phone model and browser, date and time, one line per row (pass / fail + what you saw), and screenshots only for failures. Send the failures to the lead right away; the recording starts at 12:30.

## Part 2: English subtitles (after the final video exists)

1. Get the final video (recording + voice-over) and the voice-over script from the package 03 owner.
2. Write `docs/video/subtitles_en.srt` (SubRip format: number, `00:00:01,000 --> 00:00:04,000`, text, blank line):
   - The voice-over, line by line.
   - When Spanish text on screen matters and the voice does not say it, a short bracketed translation, e.g. `[Screen: "Recommended"]`, `[Screen: "We only cover the Dry Corridor for now"]`.
   - At most 2 lines per cue, about 42 characters per line, each cue on screen at least 1 second.
3. Watch the whole video with the subtitles at phone size; fix timing.
4. Upload the `.srt` to the YouTube video as English subtitles (YouTube Studio → Subtitles). Keep the video public or unlisted, not "made for kids"; the description says the voice-over is AI-generated.
5. Send the video link to the package 07 owner (or edit only the "Demo (video)" line in `docs/submission.md`).

If you use an AI tool to transcribe or translate, say so in `docs/si-usage.md` and check every line by hand.

## Files to deliver

| Path | Purpose |
|---|---|
| `docs/qa/phone-check.md` | Phone QA report (Part 1) |
| `docs/video/subtitles_en.srt` | English subtitles (Part 2) |
| `docs/submission.md` | Only the "Demo (video)" line, if the package 07 owner agrees |
| `docs/resources.md` | A row for any tool you used (subtitle editor, YouTube Studio) |
| `docs/si-usage.md` | Your row, if you used AI |

## Conventions

- English in the report and subtitles; Spanish quoted exactly as it appears in the app.
- Branch `docs/demo-judges`, conventional commits (`docs(qa): add phone check`, `docs(video): add English subtitles`), no AI attribution. PR with 3 lines: done, not done, surprises.
- No NASA logos in the video or thumbnails; AI-generated images or frames need a visible "AI-generated" watermark.

## Done when

- [ ] `docs/qa/phone-check.md` merged and failures sent to the lead before 13:30
- [ ] English subtitles uploaded to the YouTube video and the `.srt` merged
- [ ] The video link opens with subtitles in a private window on a phone

## Coordination

- Lead: receives the QA failures; decides what gets fixed before the recording.
- Package 04 (recording) and package 03 (voice-over) owners: give you the final video and script.
- Package 07 owner: gets the video link for `docs/submission.md`.
