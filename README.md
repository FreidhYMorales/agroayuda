# AgroAyuda

Crop rotation decision support for farmers in Guatemala's Dry Corridor, built with NASA POWER data. NASA Space Apps Challenge 2026, challenge "Field Shift: Adapting Farms with NASA Data".

A farmer picks a zone on the map, says what they plant in the first (primera) and second (postrera) season, what matters most to them and whether they have irrigation, and sees their current rotation compared with two alternatives: why, evidence, benefits, what we do not know and what to check with a technician. It is a phone-first web app in Spanish, and every recommendation comes from fixed, tested rules, not from an AI at run time.

- **Live app:** https://agroayuda.vercel.app
- **API:** https://agroayuda-api.onrender.com (docs at `/docs`; the free server sleeps, the first call can take about a minute)
- Setup per OS: [docs/development.md](docs/development.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Build rules (contracts, engine, screens): [docs/spec.md](docs/spec.md)
- Rules for AI agents: [AGENTS.md](AGENTS.md)
- Team work packages: [docs/work-packages/](docs/work-packages/)
- Crop sources: [docs/crop-sources.md](docs/crop-sources.md) · Full resource list: [docs/resources.md](docs/resources.md)

## Setup

Follow [docs/development.md](docs/development.md) (Windows 11 PowerShell, Linux, macOS). In short: `uv sync`, `fnm install`, `npm --prefix web ci`, then `make check`. Run the web app with `npm --prefix web run dev`. Quality gate: `make check` must pass before every PR.

## Data sources, attributions and licences

| Source | Used for | Licence / terms |
|---|---|---|
| [NASA POWER](https://power.larc.nasa.gov/) | Daily rainfall and maximum temperature per grid cell (1991-2020): rain layer, climate normals, canícula (dry-spell) risk | NASA open data; see the POWER site for its data policy |
| [SoilGrids (ISRIC)](https://soilgrids.org/) | Soil clay, sand, pH and organic carbon | CC BY 4.0 |
| [geoBoundaries](https://www.geoboundaries.org/) | Dry Corridor region outline (ADM1 Guatemala) | ODbL 1.0 (source OpenStreetMap, per the GTM ADM1 metadata) |
| [OpenFreeMap](https://openfreemap.org/) and [OpenStreetMap](https://www.openstreetmap.org/copyright) | Basemap tiles and content (attribution shown on the map) | ODbL; tiles: see the provider page |
| [FAO ECOCROP](https://ecocrop.apps.fao.org/ecocrop/srv/en/) and FAO Irrigation and Drainage Paper 56 | Generic crop cycle, roots and tolerances | FAO; see the provider page |
| ICTA, MAGA, CGIAR and USAC documents | Crop values and rotation templates from Guatemalan sources | Cited per row in `data/catalog/*.csv`; list in [docs/crop-sources.md](docs/crop-sources.md) |

Data from NASA POWER, SoilGrids and geoBoundaries is not AI-generated. No NASA logos are used.

## Use of Super Intelligence (SI)

Before the event, we used an AI assistant to organize our ideas into a written plan and to review it, probed the NASA POWER and SoilGrids APIs, and looked at NASA POWER monthly rain normals at one Chiquimula point; no code or datasets from before the event are part of the build.

During the event, AI assistants helped write code, tests and documentation, and an English AI-generated voice-over narrates the demo video. A human reviewed and merged every change. The idea, product decisions, agronomic rules and crop values (from cited sources) are the team's own, and the app calls no AI at run time. Details per module and asset: [docs/si-usage.md](docs/si-usage.md).

## Pre-event plan

A written plan made before the event exists in `docs/` (architecture, ADRs, spec and work packages). Each of those files carries a dated preface saying it was written with AI assistance before the event.
