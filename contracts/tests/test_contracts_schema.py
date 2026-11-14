"""The committed JSON Schema in contracts/schema/ matches the Pydantic models (no drift)."""

import json

from contracts import EXAMPLE_MODELS
from contracts.export import SCHEMA_PATH, build_schema


def test_committed_schema_matches_models() -> None:
    committed = SCHEMA_PATH.read_text(encoding="utf-8")

    assert committed == build_schema(), "Run: uv run --package contracts python -m contracts.export"


def test_schema_defines_every_exported_model() -> None:
    definitions = json.loads(build_schema())["$defs"]

    assert {model.__name__ for model in EXAMPLE_MODELS.values()} <= definitions.keys()
