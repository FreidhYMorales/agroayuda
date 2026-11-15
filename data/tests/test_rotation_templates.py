"""Rotation templates: season-valid, unique pairs, ids inside CropId (stdlib csv only).

`crops.csv` belongs to the engine owner. These tests only read it: when a template does not fit the
seasons of the catalog, fix the template, never the crop values.
"""

import csv
import json
import re
from pathlib import Path

CATALOG = Path(__file__).resolve().parents[1] / "catalog"

# Frozen contract (docs/spec.md); adding a crop is a contract change made by the lead.
CROP_IDS = frozenset(
    {
        "maiz",
        "frijol",
        "maiz_frijol",
        "maicillo",
        "gandul",
        "mucuna",
        "canavalia",
        "ajonjoli",
        "ayote",
        "none",
    }
)
TEMPLATE_COLUMNS = ["id", "primera", "postrera", "description_es", "source"]


def _rows(name: str) -> list[dict[str, str]]:
    with (CATALOG / name).open(encoding="utf-8", newline="") as handle:
        return list(csv.DictReader(handle))


def _split_list(value: str) -> set[str]:
    """List cell as a set: a JSON list or values separated by ; | or ,."""
    text = value.strip()
    if text.startswith("["):
        return {str(item) for item in json.loads(text)}
    return {part.strip() for part in re.split(r"[;|,]", text) if part.strip()}


def _seasons_by_crop() -> dict[str, set[str]]:
    return {row["id"]: _split_list(row["seasons"]) for row in _rows("crops.csv")}


def test_every_template_is_season_valid() -> None:
    seasons = _seasons_by_crop()

    for row in _rows("rotation_templates.csv"):
        assert row["primera"] in seasons, f"{row['id']}: {row['primera']} is not in crops.csv"
        assert row["postrera"] in seasons, f"{row['id']}: {row['postrera']} is not in crops.csv"
        assert "primera" in seasons[row["primera"]], f"{row['id']}: {row['primera']} no primera"
        assert "postrera" in seasons[row["postrera"]], f"{row['id']}: {row['postrera']} no postrera"


def test_template_pairs_are_unique() -> None:
    pairs = [(row["primera"], row["postrera"]) for row in _rows("rotation_templates.csv")]

    assert len(pairs) == len(set(pairs))


def test_template_ids_are_in_crop_id() -> None:
    for row in _rows("rotation_templates.csv"):
        assert row["primera"] in CROP_IDS, f"{row['id']}: unknown primera {row['primera']}"
        assert row["postrera"] in CROP_IDS, f"{row['id']}: unknown postrera {row['postrera']}"


def test_template_rows_have_columns_ids_and_sources() -> None:
    with (CATALOG / "rotation_templates.csv").open(encoding="utf-8", newline="") as handle:
        assert next(csv.reader(handle)) == TEMPLATE_COLUMNS

    ids = []
    for row in _rows("rotation_templates.csv"):
        assert row["id"] == f"{row['primera']}__{row['postrera']}"
        assert row["description_es"].strip(), f"{row['id']}: empty description_es"
        assert row["source"].strip(), f"{row['id']}: every template needs a source"
        ids.append(row["id"])
    assert len(ids) == len(set(ids))


def test_every_season_valid_current_rotation_leaves_two_other_templates() -> None:
    seasons = _seasons_by_crop()
    templates = {(row["primera"], row["postrera"]) for row in _rows("rotation_templates.csv")}
    primera_crops = [crop for crop, allowed in seasons.items() if "primera" in allowed]
    postrera_crops = [crop for crop, allowed in seasons.items() if "postrera" in allowed]

    for primera in primera_crops:
        for postrera in postrera_crops:
            others = templates - {(primera, postrera)}
            assert len(others) >= 2, f"current {primera} -> {postrera} leaves {len(others)}"
