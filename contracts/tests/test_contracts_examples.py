"""Every fixture in contracts/examples/ validates against its model, and every model has one."""

import json
from pathlib import Path
from typing import Any, get_args

import pytest
from pydantic import BaseModel, TypeAdapter

from contracts import EXAMPLE_MODELS, ErrorCode

EXAMPLES_DIR = Path(__file__).resolve().parents[1] / "examples"
EXAMPLE_FILES = sorted(EXAMPLES_DIR.glob("*.json"))


def model_for(path: Path) -> type[BaseModel]:
    """Pick the model by the longest prefix of the file name, e.g. site_profile_null_soil.json."""
    matches = [prefix for prefix in EXAMPLE_MODELS if path.stem.startswith(prefix)]
    assert matches, f"{path.name} has no model; name it <prefix>[_variant].json"
    return EXAMPLE_MODELS[max(matches, key=len)]


@pytest.mark.parametrize("path", EXAMPLE_FILES, ids=lambda p: p.name)
def test_example_validates(path: Path) -> None:
    data: Any = json.loads(path.read_text(encoding="utf-8"))
    model = model_for(path)
    if isinstance(data, list):
        TypeAdapter(list[model]).validate_python(data)  # type: ignore[valid-type]
    else:
        model.model_validate(data)


def test_every_model_has_an_example() -> None:
    covered = {model_for(path) for path in EXAMPLE_FILES}

    assert set(EXAMPLE_MODELS.values()) <= covered


@pytest.mark.parametrize("code", get_args(ErrorCode))
def test_every_error_code_has_a_fixture(code: str) -> None:
    path = EXAMPLES_DIR / f"error_response_{code}.json"

    assert json.loads(path.read_text(encoding="utf-8"))["error"] == code
