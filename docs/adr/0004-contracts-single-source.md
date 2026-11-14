# 0004. Pydantic models as the single source of truth for contracts

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: accepted
- Date: 2026-11-03

## Context

Modules are built separately by different people in two languages. Hand-copied types drift and break integration on the last day.

## Decision

Contracts are Pydantic models in `contracts/src/contracts/`. A script exports JSON Schema to `contracts/schema/`; `web/` generates its TS types from those schemas (`json-schema-to-typescript`) into `web/src/contracts/` (generated, never hand-edited). `contracts/examples/` holds valid payloads used as fixtures by every module; tests in Python and TS validate them.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| Hand-written types on each side | No tooling | Drift, silent integration bugs | Too risky with parallel work |
| OpenAPI from FastAPI + `openapi-typescript` | Standard | Requires the API to exist first; blocks `web/` | Contracts must exist before any module |
| Protobuf / gRPC | Strong typing | Tooling cost, no browser-native support | Overkill |

## Consequences

- Positive: a contract change breaks tests on both sides immediately; fixtures let everyone start at once.
- Negative: one extra generation step after any contract change.
- Follow-ups: contract changes only via the lead, with regenerated schema and TS types in the same PR; a test checks the committed schema matches the models.
