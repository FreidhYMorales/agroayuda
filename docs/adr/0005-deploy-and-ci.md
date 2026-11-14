# 0005. Vercel for web, Render for API, GitHub Actions on Linux and Windows

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: accepted
- Date: 2026-11-03

## Context

Free hosting only; judges need a public URL. Four of five contributors develop on Windows, the lead on Linux.

## Decision

`web/` deploys to Vercel from `main`. `api/` deploys to a Render free web service from `main`. GitHub Actions runs `make check` on `ubuntu-latest` for every PR; `main` requires green CI (no required approvals). A `windows-latest` job is SHOULD 0 for the event (capacity); Windows contributors run `make check` locally before each PR. During the event, owners self-merge inside their own module; no CODEOWNERS file (it enforces nothing with 0 approvals). The repo is public from H0 so branch protection works on GitHub Free; CI fails when `contracts/` or `api/` changes and the author is not the lead, and when regenerated TS types differ. The ubuntu job exists from H2; branch protection and Render from H8. Amended 2026-11-13 (plan reviews 6-7: ~38 h window). Render installs with `uv sync --package api --no-dev --frozen` on Python 3.13.

## Alternatives considered

| Option | Pros | Cons | Why not chosen |
|---|---|---|---|
| Netlify for web | Equivalent | None significant | Either works; Vercel picked for Vite defaults |
| Fly.io for API | No sleep | No real free tier | Budget |
| Static-only site (scoring in TS) | No server, no cold start | Engine would be rewritten in TS | Engine is Python by ADR-0001 |
| CI on Linux only | Faster | Windows breakage found by teammates, not CI | Most contributors are on Windows |

## Consequences

- Positive: zero cost; preview deploys per PR on Vercel.
- Negative: without the Windows job, Windows breakage is caught only by each contributor's local `make check`.
- Negative: Render free instances sleep and need about a minute to wake.
- Follow-ups: `/health` endpoint; warm the API before the demo; set `VITE_API_URL` in Vercel and CORS origin in the API.
