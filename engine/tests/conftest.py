"""Shared engine fixtures: the real crop catalog, read with the stdlib csv module."""

import csv
from pathlib import Path

import pytest

from contracts import CropCatalogEntry, RotationTemplate, SiteProfile

REPO_ROOT = Path(__file__).resolve().parents[2]
CROPS_CSV = REPO_ROOT / "data" / "catalog" / "crops.csv"


def load_crops() -> dict[str, CropCatalogEntry]:
    with CROPS_CSV.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    crops = (
        CropCatalogEntry.model_validate({**row, "seasons": row["seasons"].split(";")})
        for row in rows
    )
    return {crop.id: crop for crop in crops}


@pytest.fixture
def crops() -> dict[str, CropCatalogEntry]:
    return load_crops()


@pytest.fixture
def maiz(crops: dict[str, CropCatalogEntry]) -> CropCatalogEntry:
    return crops["maiz"]


@pytest.fixture
def frijol(crops: dict[str, CropCatalogEntry]) -> CropCatalogEntry:
    return crops["frijol"]


@pytest.fixture
def site() -> SiteProfile:
    path = REPO_ROOT / "contracts" / "examples" / "site_profile.json"
    return SiteProfile.model_validate_json(path.read_text("utf-8"))


def template(primera: str, postrera: str) -> RotationTemplate:
    return RotationTemplate.model_validate(
        {
            "id": f"{primera}__{postrera}",
            "primera": primera,
            "postrera": postrera,
            "description_es": "Plantilla de prueba.",
            "source": "test only: stub until package 04 lands rotation_templates.csv",
        }
    )


@pytest.fixture
def templates() -> list[RotationTemplate]:
    """Stub templates from the lead's curated list, in CSV order."""
    return [
        template("maiz_frijol", "maicillo"),
        template("frijol", "maicillo"),
        template("maiz", "frijol"),
    ]
