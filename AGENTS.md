# AGENTS.md

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Rules for ANY AI (CLI agent or browser chat) working on this repo. Keep it short; details live in `docs/architecture.md`, build rules in `docs/spec.md`, setup per OS in `docs/development.md`.

## Stack

- Python 3.13 (uv workspace): FastAPI, Pydantic, DuckDB, pandas, xarray, rioxarray, earthaccess, httpx.
- TypeScript (Node 24, npm): React + Vite, MapLibre GL JS, Recharts.
- Data: precomputed Parquet in `data/output/`, read with DuckDB.

## Platforms

- Targets: mobile-first web app (phone width first); public URL for the demo.
- Dev setup: follow `docs/development.md` for your OS (Windows 11 or Linux). Do not assume the maintainer's OS, package manager or shell. Makefile recipes must not use `cd` or shell-specific syntax.

## Folder map

```
contracts/  Pydantic models (source of truth), schema/, examples/ fixtures
data/       offline pipeline -> data/output/*.parquet; data/catalog/ CSVs
engine/     pure rotation rules + scoring, no I/O
api/        FastAPI: DuckDB + engine -> contract responses
web/        React UI; web/src/contracts/ is GENERATED
docs/       architecture, spec, development, ADRs, work-packages
```

## Conventions

- Naming: Python `snake_case`, classes `PascalCase`; TS `camelCase`, components `PascalCase.tsx`; JSON fields `snake_case`.
- Code, comments, docs: English. UI copy: English by default (for the judges) and Spanish (Guatemala) with `?lang=es`; Spanish always "usted"; short plain sentences, icon plus text in both.
- Format/lint: `uv run ruff format .`, `uv run ruff check .`, `npm --prefix web run format`, `npm --prefix web run lint`.
- Commits: conventional commits with module scope, e.g. `feat(engine): ...`; no AI attribution.
- Tests first (Strict TDD). Run `uv run pytest` and `npm --prefix web run test`; typecheck with `uv run mypy contracts/src engine/src api/src data/src` and `npm --prefix web run typecheck`.
- Tests never call the network; use `contracts/examples/` and recorded responses.
- Engine rules, Scoring v1, screen states and copy come from `docs/spec.md`. Crop values change only with a cited source, never to make a test pass.
- Work is done only when `make check` passes; never weaken or skip checks to make it pass.

## Working with AI (teammates)

- Each teammate owns one work package in `docs/work-packages/`. Give your AI that file as context (a Claude.ai/ChatGPT Project, or point your CLI agent at it) and start with its "Paste this at the top of your AI chat" block.
- Only create or edit the files your package lists under "Files to deliver". If a change seems needed elsewhere, ask the owner or the lead.
- Branch per task, then PR. Self-merge only green PRs inside your own files. On Windows, run `make check` locally before every PR (CI also runs a `check-windows` job since Sat 11:00).
- Before H2 (Sat 10:00) there is no repo: work in a scratch folder with the inline contracts from your package; move the code in after you clone.
- Never paste secrets, tokens or `.env` contents into an AI chat.
- Review what the AI wrote before committing: run the tests, read the diff, and make sure it did not touch contracts or other owners' files.
- AI-generated images or video need a visible "AI-generated" watermark; AI audio is acknowledged in the description and video metadata. No NASA logos.
- Every external resource (dataset, document, library, image, font, icon, tool) gets a row in `docs/resources.md` in the same PR; the submission confirms that list is complete.
- SI disclosure is required for code and data too: each owner fills their row in `docs/si-usage.md` (tool used and how). Keep README's "Use of Super Intelligence (SI)" section when editing README.

## Do not

- Do not change frozen contracts (`contracts/src/`, `contracts/schema/`, `contracts/examples/`) without the lead's agreement; CI blocks it.
- Do not edit `api/` unless you are the lead; CI blocks it.
- Do not hand-edit `web/src/contracts/` (generated).
- Do not put I/O in `engine/` or scoring logic in `api/` or `web/`.
- Do not add dependencies without the lead's approval.
- Do not commit secrets; use `.env` (see `.env.example`).
- Do not edit files owned by another module's owner.
