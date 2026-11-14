"""Shared engine fixtures: the real crop catalog, read with the stdlib csv module."""

import csv
from pathlib import Path

import pytest

from contracts import CropCatalogEntry

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
