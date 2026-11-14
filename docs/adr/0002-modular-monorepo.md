# 0002. Modular monorepo, one module per owner

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: accepted
- Date: 2026-11-03

## Context

Five people build in parallel during a ~38 h hackathon, each part built separately and integrated at the end. Most teammates are learning the stack, so boundaries must be obvious and conflicts rare.

## Decision

One repository with modules `contracts/`, `data/`, `engine/`, `api/`, `web/`. Each module has one owner. Modules talk only through the models in `contracts/`; every module develops against `contracts/examples/` fixtures until integration.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| Two repos (backend, frontend) | Independent deploys | Duplicate CI and permissions; contracts have no shared home; harder integration | More coordination than it saves |
| Hexagonal / clean architecture | Swappable adapters | Ports and adapters for one data source and one UI | Over-engineering for a ~38 h demo |
| Feature folders in a single app | Simple | Mixes Python and TS; unclear ownership | Ownership per person is the main need |

## Consequences

- Positive: clear ownership; parallel work from hour one; one `make check` and one CI.
- Negative: the uv workspace and npm project live side by side; the lead must keep contracts stable.
- Follow-ups: freeze contracts at H0-H2 of the event (pre-event work is not allowed); branch protection on `main`.
