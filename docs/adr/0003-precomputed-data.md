# 0003. Precompute pilot-region data into Parquet, query with DuckDB

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: accepted
- Date: 2026-11-03

## Context

Tests on 2026-11-03: NASA POWER answered in about 1.3 s per point, SoilGrids in about 7.5 s and returned all-null values for one point. A live demo depending on these services is fragile. The pilot region (Guatemala's Dry Corridor) is fixed and small.

## Decision

`data/` downloads and aggregates data for a point grid over the pilot region ahead of time and writes small Parquet files to `data/output/`, committed to git. `api/` reads them with DuckDB at request time. No external calls during a request.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| Live API calls per request | Any location, always fresh | Slow, rate limits, outages during the demo | Demo reliability matters most |
| PostgreSQL/PostGIS | Spatial queries | Hosting, migrations, setup on Windows | Too heavy for a few MB of static data |
| SQLite | Simple | Less convenient for columnar/analytical queries | DuckDB reads Parquet directly |

## Consequences

- Positive: fast, offline-capable, reproducible demo; tests use the same files.
- Negative: only the pilot region is covered; data is a snapshot.
- Follow-ups: keep Parquet under a few MB; document the grid resolution and data date in `data/README.md`; note NASA POWER is used for normals and seasonality, not trends (see the research guide).
