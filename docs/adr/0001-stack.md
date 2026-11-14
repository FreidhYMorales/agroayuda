# 0001. Python for data/logic/API, TypeScript + React for the web

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: accepted
- Date: 2026-11-03

## Context

The tool must read NASA Earth observation data (NASA POWER API, HDF5/NetCDF products, GeoTIFF), soil data (SoilGrids), apply agronomic rules and show results on a phone-friendly map. Team of 5; the lead decided to pick languages by fit for the problem rather than current skills, using the 11 days before the hackathon to learn the needed slice with AI help and the lead's support.

## Decision

Python 3.13 (uv workspace, FastAPI, Pydantic, xarray, rioxarray, earthaccess, DuckDB) for data, engine and API. TypeScript + React + Vite + MapLibre GL + Recharts for the web. Mixed stack is justified: the Earth-science capability has no viable option in TS, and the interactive mobile UI has no good option in Python.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| All Python with Streamlit | One language, fastest demo | Weak mobile UX and visual polish; hurts the presentation criterion | Target user is a field technician on a phone |
| All TypeScript (Node backend) | One language | Immature NetCDF/HDF5/raster tooling; reimplementing the NASA ecosystem | Data is the core of the challenge |
| Go or Rust backend | Fast, typed | No Earth-science ecosystem; steep learning curve | No benefit for this domain |
| Svelte or Vue instead of React | Simpler syntax | Fewer examples and less AI training data | React maximizes help for learners |

## Consequences

- Positive: every NASA tutorial and library applies directly; typed on both sides; strong AI support.
- Negative: two toolchains to install (uv + Node) on Windows; teammates must learn the basics of one of them.
- Follow-ups: per-person learning list (Python + pandas + raster basics, or DOM + fetch + React components/props/state); Windows support through local `make check` (Windows CI job is SHOULD, ADR-0005).
