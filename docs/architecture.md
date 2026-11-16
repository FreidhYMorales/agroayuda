# Architecture: Field Shift (NASA Space Apps 2026, Challenge 7)

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

- Status: approved
- Mode: greenfield
- Last updated: 2026-11-13 (build rules in [spec.md](spec.md))
- ADRs: [docs/adr/](adr/)

A decision-support tool that helps farmers and extension technicians in Guatemala's Dry Corridor compare crop rotation options for the *primera* and *postrera* seasons, using NASA Earth observations, soil data, crop characteristics and farmer priorities.

## Constraints

| Constraint | Value |
|---|---|
| Deadline | Local event Sat 2026-11-14 08:00 to internal hard stop Sun 2026-11-15 21:59 (~38 h, one night); official submission close Sun 23:59 local. Pre-event work on the challenge is not allowed (official Participant FAQs); repo and contracts start at H0. |
| Team | 5 people. The lead owns contracts, API, integration and spot checks; 4 teammates are learning the stack. Stack chosen by fit, not by current skills (ADR-0001). |
| Hosting / budget | Free tiers only: Vercel (web), Render (api), GitHub (repo, CI). |
| Required capabilities | Geospatial and climate data processing (NetCDF/HDF5/GeoTIFF, NASA APIs), interactive map, charts, rule-based scoring, works on a phone. |
| Target platforms | Web, mobile-first (phone width first, desktop second). |
| Distribution | Public URL for the demo and judges. |
| Dev environments | Windows 11 (4 contributors), Arch Linux (lead). Setup in [development.md](development.md). |

## Stack

| Layer | Choice | Why (ADR) |
|---|---|---|
| Language (data, logic, API) | Python 3.13, managed with `uv` (workspace) | Strongest Earth-science ecosystem (ADR-0001) |
| Language (UI) | TypeScript, Node 24 LTS, `npm` | Typed, mainstream, best AI support (ADR-0001) |
| Frontend | React + Vite | Most docs and examples for learners (ADR-0001) |
| Map / charts | MapLibre GL JS, Recharts | Free, fast, mobile-friendly |
| Backend | FastAPI + Pydantic | Typed I/O, auto OpenAPI docs (ADR-0001) |
| Data layer | Precomputed Parquet files queried with DuckDB | No live dependency on NASA APIs during the demo (ADR-0003) |
| Key libraries | `httpx`, `pandas`, `xarray`, `rioxarray`, `earthaccess`, `duckdb`, `pydantic` | |
| Contracts | Pydantic models → JSON Schema + example fixtures → generated TS types | Single source of truth (ADR-0004) |
| Deploy | Vercel (web), Render (api) | Free, deploy from GitHub (ADR-0005) |

## Architecture style

Modular monorepo, one module per owner, modules connected only through frozen contracts (ADR-0002). Proportional for a ~38 h demo by 5 people building in parallel. Rejected: two repos (duplicate CI, no shared home for contracts) and hexagonal/clean architecture (ports and adapters for a single data source is over-engineering).

```
agroayuda/
├─ contracts/          # Pydantic models (source of truth) + exported JSON Schema + example fixtures
│  ├─ src/contracts/
│  ├─ schema/          # generated *.schema.json (committed)
│  └─ examples/        # valid example payloads used by every module as fixtures
├─ data/               # offline pipeline: download NASA POWER, SoilGrids, crop table -> Parquet
│  ├─ src/data_pipeline/
│  └─ output/          # generated *.parquet (committed; small, pilot region only)
├─ engine/             # pure rotation logic: agronomic rules + MCDA scoring (no I/O)
│  └─ src/engine/
├─ api/                # FastAPI: reads Parquet via DuckDB, calls engine, returns contracts
│  └─ src/api/
├─ web/                # React + TS + MapLibre + Recharts
│  └─ src/
├─ docs/               # architecture, development, ADRs
├─ pyproject.toml      # uv workspace root (members: contracts, data, engine, api)
├─ Makefile            # `make check` quality gate
└─ AGENTS.md
```

| Folder | What goes here | What must NOT go here |
|---|---|---|
| `contracts/` | Pydantic models for every payload crossing a module boundary; schema export; examples | Business logic, I/O, HTTP |
| `data/` | Download, clean, aggregate, write Parquet; `data/catalog/` (crops.csv, rotation_templates.csv) exported to `data/output/crops.parquet` + `rotation_templates.parquet` and `web/public/data/*.json` | Scoring logic; anything imported by `api/` at runtime except the Parquet files |
| `engine/` | Pure functions: `(SiteProfile, RecommendationRequest, CropCatalog, RotationTemplates) -> list[RotationOption]` (exactly 3) and `site_risks(SiteData) -> list[SiteRisk]` (run by the data pipeline; results stored in Parquet) | Network, files, DuckDB, FastAPI |
| `api/` | Endpoints, DuckDB queries, mapping rows to contract models, error handling | Agronomic rules (call `engine`) |
| `web/` | Screens, map, charts, priority form, results; generated types in `web/src/contracts/` | Hand-written copies of contract types; scoring logic |

### Data flow

```
data/ (offline, before demo) --Parquet--> api/ --SiteProfile--> engine/
                                          api/ <--RotationOption[]--
web/ --RecommendationRequest (HTTP JSON)--> api/ --RecommendationResponse--> web/
```

### Contracts

The Pydantic models in `contracts/src/` are the only source of truth (ADR-0004); they are frozen by the lead at H2 of the event. Do not implement any earlier draft. Engine rules (incl. Scoring v1), screen states and copy live in `docs/spec.md`.

## Module ownership (proposal for the lead)

Each module is built separately against `contracts/examples/`, so nobody waits for anybody. Integration replaces fixtures with real modules.

| Person | Module | Delivers | Depends on (via fixtures) |
|---|---|---|---|
| Lead | `contracts/`, `api/`, integration, spot checks, CI | Frozen contracts + examples; thin API | `engine` interface, `data` Parquet schema |
| Teammate A | `data/`, `web/public/data/`, `engine/src/engine/risks.py` | Parquet: monthly + dekadal NASA POWER normals and SoilGrids on the native grid; static layer, region and demo-point files; site risk rules; first responder for Python questions | Contract field names only |
| Teammate B | `engine/` (except `risks.py`) | `data/catalog/crops.csv`; alternatives, priority ranking, deltas and evidence with tests (Strict TDD) | `SiteProfile` and request examples |
| Teammate C | `web/` map and site view | Map, rain layer, demo-place list, site risk list, Vercel setup, map-side bug fixing incl. phone checks, 30 s video script and AI voice-over; first responder for TypeScript questions | `SiteProfile` example |
| Teammate D | `web/` priorities and results | One-page input form (crops, priorities 1-5, irrigation), comparison table + plain-list option detail, error/empty states; `data/catalog/rotation_templates.csv`; uptime pinger (external HTTP monitor); judge README with source attributions; project page (single editor) | Request and response examples |

Integration checkpoints: contracts frozen (H0-H2) → each module green against fixtures → `api` wires `data` + `engine` → `web` points at the deployed API → demo rehearsal.

## Conventions

- Naming: Python `snake_case` modules and functions, `PascalCase` classes; TS `camelCase` functions, `PascalCase` components in `PascalCase.tsx`; JSON fields `snake_case` (match Pydantic).
- Code, comments and docs: English. UI copy: English by default (for the judges) and Spanish (Guatemala) with `?lang=es`.
- Formatter / linter: Python `ruff format` + `ruff check` (config in root `pyproject.toml`); TS `biome` (`web/biome.json`).
- Typecheck: `mypy --strict` (Python), `tsc --noEmit` (TS).
- Commits: conventional commits with module scope (`feat(engine): add legume rotation rule`), no AI attribution.
- Branching / PR flow: short-lived branch per task → PR → squash merge to `main`. `main` is protected; the ubuntu CI check must be green (0 approvals). During the event, owners self-merge green PRs inside their own module; the lead spot-checks at H10 and H16, and CI blocks changes to `contracts/` and `api/` by anyone but the lead.
- Dependencies: allowlist per module (the Stack table above). No new dependency without the lead's approval.
- Contracts: `contracts/src/`, `contracts/schema/`, `contracts/examples/` are frozen once agreed; changes need the lead's approval and a regenerated schema and TS types in the same PR.

## Testing

| Layer | Tool | What MUST be tested | Command |
|---|---|---|---|
| Unit / domain | `pytest` | Every engine rule and the scoring function | `uv run pytest engine` |
| Contract (Python) | `pytest` + Pydantic | Every file in `contracts/examples/` validates; exported schema matches models | `uv run pytest contracts` |
| Contract (TS) | `vitest` | Examples type-check against generated types; API client parses examples | `npm --prefix web run test` |
| API | `pytest` + FastAPI `TestClient` | Endpoints return contract-valid bodies; errors use `ErrorResponse` | `uv run pytest api` |
| Golden | `pytest` | Engine: a synthetic fixture with fewer and shorter dry spells gives a lower canícula level, exactly 3 options for every season-valid current rotation, water-first vs income-first differ. Data: the golden cell's canícula level equals the documented rule (N and cut-offs fixed before the cell is computed); POWER -999 becomes NaN; Chiquimula cell bounds; SoilGrids null point yields null soil and no crash; rain.geojson cells equal Parquet cells; catalog covers CropId | `uv run pytest engine data` |
| UI | `vitest` + Testing Library | Form validation, empty/error states render | `npm --prefix web run test` |

Strict TDD: write the failing test first. Tests never hit the network; use fixtures from `contracts/examples/` and recorded API responses.

## Config & secrets

- `.env.example` committed: `EARTHDATA_TOKEN=changeme` (used only by `data/`), `VITE_API_URL=http://localhost:8000`.
- `.gitignore`: `.env`, `.env.*` (except `.env.example`), `.venv/`, `__pycache__/`, `.mypy_cache/`, `.ruff_cache/`, `.pytest_cache/`, `node_modules/`, `web/dist/`, `.claude/settings.local.json`, `data/cache/`.
- CI/deploy secrets: GitHub Actions secrets, Vercel and Render environment variables. The deployed API needs no secret (it reads committed Parquet).

## CI / deploy

- Quality gate: `make check`, created by `/flow:bootstrap` from this recipe (in order). Recipes call one tool per line with `--directory`/`--prefix` (no `cd`, no shell builtins) so they run the same on Windows and Linux.
  1. Format check: `uv run ruff format --check .` and `npm --prefix web run format:check` (`biome format .`)
  2. Lint: `uv run ruff check .` and `npm --prefix web run lint` (`biome lint .`)
  3. Typecheck: `uv run mypy contracts/src engine/src api/src data/src` and `npm --prefix web run typecheck` (`tsc --noEmit`)
  4. Tests: `uv run pytest` and `npm --prefix web run test` (`vitest run`)
- CI on every PR: `make check` on `ubuntu-latest` from H2 (`.github/workflows/check.yml`), with uv/npm caching; a `check-windows` job runs the same gate on `windows-latest` (added Sat 11:00, not a required check); a step fails when `contracts/`, `api/`, `web/src/contracts/` or `.github/` changes and the PR author is not the lead; CI regenerates the TS types and fails on drift. The repo is public from H0 (branch protection on GitHub Free).
- Deploy target: `web/` on Vercel (auto-deploy from `main`, `VITE_API_URL` env var); `api/` on Render free web service (auto-deploy from `main`). Render free instances sleep when idle and take about a minute to wake: hit `/health` a few minutes before the demo.

## Observability & errors

- API: standard `logging` to stdout (Render shows it); every error returns `ErrorResponse` with an HTTP status; `/health` endpoint.
- Missing data is a value, not an exception: null soil fields plus a `SiteRisk` with level "unknown"; the engine lowers confidence and adds a `data_gaps` entry.
- Web: loading, error and "sin dato" states for every request; one top-level React error boundary with a retry button.

## Accessibility & i18n

- UI language: English by default, Spanish (Guatemala) with local vocabulary (primera, postrera, canícula, milpa, maicillo, ayote) through the ES/EN toggle, kept in the URL as `?lang=es`. The splash follows the same rule from an inline script in `web/index.html`. Code language: English. No i18n framework (copy modules per screen).
- Mobile-first layout, touch targets at least 44 px, readable on a low-end phone.
- Risk and scores always use color plus icon or text, never color alone; WCAG AA contrast.
- Form inputs have labels; map interactions have a non-map alternative (list of demo places; municipio search is SHOULD).
