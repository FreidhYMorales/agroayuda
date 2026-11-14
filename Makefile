# Quality gate. One tool per line, no `cd` or shell builtins: runs the same on Windows and Linux.
.PHONY: check fmt

check:
	uv run ruff format --check .
	npm --prefix web run format:check
	uv run ruff check .
	npm --prefix web run lint
	uv run mypy contracts/src engine/src api/src data/src
	npm --prefix web run typecheck
	uv run pytest
	npm --prefix web run test

fmt:
	uv run ruff format .
	uv run ruff check --fix .
	npm --prefix web run format
