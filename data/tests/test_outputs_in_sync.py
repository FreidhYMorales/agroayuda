"""The committed outputs must match the committed catalogs and each other.

If one of these tests fails after you edited data/catalog/*.csv, the generated files are stale.
Regenerate them with one pipeline run and commit everything it writes:

    uv run --package data-pipeline python -m data_pipeline
"""

import json
from pathlib import Path
from typing import Any

import duckdb
from pydantic import BaseModel

from contracts import CropCatalogEntry, RotationTemplate
from data_pipeline.outputs import read_catalog_csv
from data_pipeline.parquet_io import read_site_data

REPO = Path(__file__).resolve().parents[2]
CATALOG = REPO / "data" / "catalog"
OUTPUT = REPO / "data" / "output"
WEB = REPO / "web" / "public" / "data"
RERUN = "stale outputs: run `uv run --package data-pipeline python -m data_pipeline` and commit"


def parquet_models[M: BaseModel](path: Path, model: type[M]) -> list[M]:
    with duckdb.connect() as con:
        cursor = con.execute(
            "SELECT * EXCLUDE (file_row_number) "
            "FROM read_parquet(?, file_row_number = true) ORDER BY file_row_number",
            [path.as_posix()],
        )
        names = [column[0] for column in cursor.description or []]
        rows: list[tuple[Any, ...]] = cursor.fetchall()
    return [model.model_validate(dict(zip(names, row, strict=True))) for row in rows]


def web_json(name: str) -> Any:
    return json.loads((WEB / name).read_text("utf-8"))


def test_crops_parquet_and_json_match_crops_csv() -> None:
    expected = read_catalog_csv(CATALOG / "crops.csv", CropCatalogEntry)

    assert parquet_models(OUTPUT / "crops.parquet", CropCatalogEntry) == expected, RERUN
    assert web_json("crops.json") == [crop.model_dump() for crop in expected], RERUN


def test_templates_parquet_and_json_match_rotation_templates_csv() -> None:
    expected = read_catalog_csv(CATALOG / "rotation_templates.csv", RotationTemplate)

    assert parquet_models(OUTPUT / "rotation_templates.parquet", RotationTemplate) == expected, (
        RERUN
    )
    assert web_json("rotation_templates.json") == [t.model_dump() for t in expected], RERUN


def test_rain_layer_cells_equal_sites_parquet_cells() -> None:
    sites = read_site_data(OUTPUT / "sites.parquet")
    rain = web_json("layers/rain.geojson")

    assert sorted(f["id"] for f in rain["features"]) == sorted(s.cell_id for s in sites), RERUN


def test_every_output_carries_one_data_version() -> None:
    versions = {site.data_version for site in read_site_data(OUTPUT / "sites.parquet")}
    for name in ["layers/rain.geojson", "region.geojson", "region_mask.geojson"]:
        versions.add(web_json(name)["data_version"])

    assert len(versions) == 1, f"{RERUN} (found {sorted(versions)})"
