# Project page: draft fields (English)

> Draft for the Space Apps project page. The web-results owner is its single editor: first save on Saturday after 09:00 (name, summary, repo link, members), final save by H35 (Sunday 19:00); the last save counts. Paste each field once. Check every claim against the app before pasting.

## Project name

AgroAyuda

## Challenge

Field Shift: Adapting Farms with NASA Data

## Summary

AgroAyuda is a phone-first web app that helps farmers in Guatemala's Dry Corridor compare their current crop rotation with two alternatives. It uses NASA POWER rainfall and temperature to estimate the risk of the mid-summer dry spell (canícula) at the farmer's location, and explains each option in plain Spanish: why, the evidence, the benefits, what we do not know and what to check with a local technician.

## Description

The farmer taps a zone on the map, sees its climate risks, then answers one short form: what they plant in the first (primera) and second (postrera) season, what matters most to them (saving water, protecting soil, earning more, lower risk) and whether they have irrigation. The app compares their current rotation with two alternatives taken from a curated list of local rotations with cited sources (ICTA, MAGA, CGIAR). The comparison shows water, soil, income and risk scores, a confidence level, the months the field stays bare and a clear badge for each option: recommended, not recommended (with the reason) or a warning on the current rotation. When no alternative beats the current rotation, the app says so.

Everything is precomputed from NASA POWER (1991-2020), SoilGrids and geoBoundaries data, so the app needs no data provider at run time. Every recommendation comes from fixed, tested rules; the app calls no AI at run time. Crop values come from cited sources and are marked as general values to validate locally when no Guatemalan source exists. The text is Spanish (Guatemala), in the formal "usted", with icons always next to text and touch targets of at least 44 px.

## SI (Super Intelligence) use disclosure

Before the event, we used an AI assistant (Claude) to organize our ideas into a written plan and to review it, probed the NASA POWER and SoilGrids APIs, and looked at NASA POWER monthly rain normals at one Chiquimula point; no code or datasets from before the event are part of the build.

During the event, AI (Claude and Claude Code) was used as a coding assistant (code, tests and documentation), and the English voice-over of the demo video was generated with AI (ElevenLabs; also stated in the video metadata), and the logo was generated with ChatGPT and Gemini (marked "AI-generated"). A human reviewed and merged every change. Details per module: docs/si-usage.md in the repository.

## NASA data used

- NASA POWER (Prediction Of Worldwide Energy Resources) Daily API: daily rainfall and maximum temperature, 1991-2020, per grid cell. https://power.larc.nasa.gov/
- NASA POWER documentation. https://power.larc.nasa.gov/docs/

## References and attributions

The complete list with licences is in `docs/resources.md`; copy the two tables from there (Link Text = Name, Link Url = URL). Main sources:

- SoilGrids (ISRIC), CC BY 4.0. https://soilgrids.org/
- geoBoundaries, ODbL 1.0. https://www.geoboundaries.org/
- OpenFreeMap tiles: free public instance, commercial use allowed; attribution required ("OpenFreeMap © OpenMapTiles, Data from OpenStreetMap", added by MapLibre); software MIT; map data from OpenStreetMap (ODbL). https://openfreemap.org/ · https://www.openstreetmap.org/copyright
- FAO ECOCROP and FAO Irrigation and Drainage Paper 56. https://ecocrop.apps.fao.org/ecocrop/srv/en/ · https://www.fao.org/4/x0490e/x0490e0e.htm
- ICTA, El cultivo del maíz en Guatemala (2002); ICTA Memoria de Labores 2019; ICTA Boletín octubre 2022 (abonos verdes); CGIAR guide to bean cultivation in Guatemala (2024); MAGA Agro en Cifras 2016 (sesame); USAC studies (Jutiapa, Jalapa). Links in `docs/crop-sources.md`.

## Links

- Demo (video): TODO (public or unlisted YouTube link, not marked "made for kids")
- Final project: https://agroayuda.vercel.app
- Repository: https://github.com/FreidhYMorales/agroayuda
- Members: TODO (names of the team)

## Before the final save (checklist)

- [ ] Open the demo link and the final-project link in a private window on a phone.
- [ ] The video is public or unlisted and not marked "made for kids".
- [ ] The video description and metadata say the voice-over is AI-generated.
- [ ] No NASA logos anywhere.
- [ ] Every required field is filled and every claim was checked against the app.
- [ ] The uptime monitor on the API `/health` is on (the lead set it up).
