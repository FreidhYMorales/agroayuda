# AgroAyuda

Crop rotation decision support for farmers in Guatemala's Dry Corridor, built with NASA POWER data. NASA Space Apps Challenge 2026, challenge "Field Shift: Adapting Farms with NASA Data".

- Setup per OS: [docs/development.md](docs/development.md)
- Architecture: [docs/architecture.md](docs/architecture.md)
- Build rules (contracts, engine, screens): [docs/spec.md](docs/spec.md)
- Rules for AI agents: [AGENTS.md](AGENTS.md)
- Team work packages: [docs/work-packages/](docs/work-packages/)

Quality gate: `make check` must pass before every PR.

## Use of Super Intelligence (SI)

We used AI assistants to organize and review our plan, to help write code, tests and documentation, and for the English voice-over of the demo video. The idea, product decisions, agronomic rules and crop values (from cited sources) are the team's own; NASA POWER, SoilGrids and geoBoundaries data are not SI-generated, and the app calls no AI at run time. Details per module and asset: [docs/si-usage.md](docs/si-usage.md).
