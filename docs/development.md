# Development setup: Field Shift

> Written before the event (2026-11-13) as part of the team's planning; see the SI disclosure on the project page.

Anyone must be able to go from a fresh clone to a green `make check` with this file alone, on any supported dev OS.

## Supported dev environments

| OS | Status | Notes |
|---|---|---|
| Windows 11 | supported | 4 contributors. Native PowerShell; no WSL needed. Run `make check` locally before each PR (the `windows-latest` CI job is SHOULD 0 during the event). |
| Arch Linux | supported | Lead's machine. Checked in CI (`ubuntu-latest`). |
| macOS 14+ | best effort | Untested; `brew install uv fnm make` should work. |

## Toolchain versions

Pinned in: `.python-version` (3.13, read by `uv`) and `.nvmrc` (24, read by `fnm`). Install pinned versions with `uv` and `fnm`, not a "latest" package from winget or pacman: those drift from the pin.

Line endings: `.gitattributes` forces LF (`* text=auto eol=lf`). A clone made before it landed: `git add --renormalize . && git checkout -- .`.

| Tool | Version | Why it is needed |
|---|---|---|
| Git | any recent | Version control |
| uv | latest | Installs Python 3.13, manages the Python workspace and runs tools |
| fnm | latest | Installs the Node version in `.nvmrc` |
| Node | 24.x (LTS) | Builds and tests `web/` |
| make | any | `make check` quality gate |

## Install prerequisites

### Windows 11 (PowerShell)

```powershell
winget install Git.Git astral-sh.uv Schniz.fnm ezwinports.make
```

Close and reopen PowerShell, then enable `fnm` in your profile once:

```powershell
if (-not (Test-Path $PROFILE)) { New-Item -ItemType File -Path $PROFILE -Force }
Add-Content $PROFILE 'fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression'
```

Reopen PowerShell again. If scripts are blocked: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`.

Recommended editor: VS Code with the Python, Ruff, Mypy Type Checker and Biome extensions.

### Arch Linux

```bash
sudo pacman -S --needed git make uv fnm
echo 'eval "$(fnm env --use-on-cd --shell zsh)"' >> ~/.zshrc   # use bash instead of zsh if needed
```

`mise` also works if you already use it (enable idiomatic version files for `.nvmrc`).

### macOS

```bash
brew install git make uv fnm
```

## First run

```bash
git clone <repo-url>
cd agroayuda
cp .env.example .env          # Windows PowerShell: Copy-Item .env.example .env
uv sync                       # installs Python 3.13 and all Python dependencies
fnm install                   # installs the Node version from .nvmrc
npm --prefix web ci           # installs web dependencies
make check                    # must pass before you change anything
```

Only the person working on `data/` needs a real `EARTHDATA_TOKEN` in `.env` (create it at https://urs.earthdata.nasa.gov/ → Generate Token).

## Daily commands

| Task | Command |
|---|---|
| Run the API | `uv run fastapi dev api/src/api/main.py` (http://localhost:8000/docs) |
| Run the web app | `npm --prefix web run dev` (http://localhost:5173) |
| Rebuild data | `uv run --package data-pipeline python -m data_pipeline` |
| Export contract schema | `uv run --package contracts python -m contracts.export` |
| Regenerate TS types | `npm --prefix web run contracts` |
| Python tests | `uv run pytest` |
| Web tests | `npm --prefix web run test` |
| Format | `make fmt` |
| Full quality gate | `make check` |

## Troubleshooting

| Symptom | OS | Fix |
|---|---|---|
| `make: command not found` / not recognized | Windows | `winget install ezwinports.make`, then reopen the terminal |
| `node` not found or wrong version | Windows | The `fnm` line is missing from `$PROFILE`; add it and reopen PowerShell, then `fnm install` |
| Format check fails on files you did not touch | Windows | Line endings: `git add --renormalize .` then `git checkout -- .` |
| `uv` uses a different Python | any | `uv python install 3.13` then `uv sync` |
| API returns empty soil fields | any | Expected for some points (SoilGrids has gaps); see the `unknown` risk and `data_gaps` in the response |
| First API call takes about a minute (deployed) | any | Render free tier was asleep; call `/health` before demos |
