import csv
import json
from pathlib import Path

import duckdb
import pytest

from contracts import CropCatalogEntry, DemoPoint, RainCellProperties, RotationTemplate, SiteData
from data_pipeline.outputs import (
    DEMO_POINTS,
    RainCell,
    rain_geojson,
    read_catalog_csv,
    region_geojson,
    region_rings,
    write_catalog_parquet,
    write_json,
    write_region_parquet,
)

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"
REGION_ISO = {"GT-CQ"}


def example_site() -> SiteData:
    return SiteData.model_validate_json((EXAMPLES / "site_data.json").read_text("utf-8"))


def example_crops() -> list[dict[str, object]]:
    crops: list[dict[str, object]] = json.loads((EXAMPLES / "crop_catalog.json").read_text("utf-8"))
    return crops


def write_csv(path: Path, rows: list[dict[str, object]]) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)


def boundaries() -> dict[str, object]:
    ring = [[-89.5, 14.6], [-89.4, 14.6], [-89.4, 14.7], [-89.5, 14.6]]
    other = [[-90.5, 14.6], [-90.4, 14.6], [-90.4, 14.7], [-90.5, 14.6]]
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"shapeName": "Chiquimula", "shapeISO": "GT-CQ"},
                "geometry": {"type": "Polygon", "coordinates": [ring]},
            },
            {
                "type": "Feature",
                "properties": {"shapeName": "Guatemala", "shapeISO": "GT-GU"},
                "geometry": {"type": "Polygon", "coordinates": [other]},
            },
        ],
    }


# --- region --------------------------------------------------------------------------------------


def test_region_keeps_only_the_chosen_departments() -> None:
    rings = region_rings(boundaries(), REGION_ISO)

    assert rings == [[[-89.5, 14.6], [-89.4, 14.6], [-89.4, 14.7], [-89.5, 14.6]]]


def test_region_reads_multipolygon_parts() -> None:
    collection = boundaries()
    features = collection["features"]
    assert isinstance(features, list)
    polygon = features[0]["geometry"]["coordinates"]
    features[0]["geometry"] = {"type": "MultiPolygon", "coordinates": [polygon, polygon]}

    assert len(region_rings(collection, REGION_ISO)) == 2


def test_region_parquet_has_one_ring_per_row(tmp_path: Path) -> None:
    rings = region_rings(boundaries(), REGION_ISO)
    path = tmp_path / "region.parquet"

    write_region_parquet(rings, path)

    with duckdb.connect() as con:
        rows = con.execute("SELECT ring FROM read_parquet(?)", [path.as_posix()]).fetchall()
    assert [row[0] for row in rows] == rings


def test_region_geojson_carries_the_data_version() -> None:
    geojson = region_geojson(boundaries(), REGION_ISO, "2026-11-14")

    assert geojson["data_version"] == "2026-11-14"
    features = geojson["features"]
    assert isinstance(features, list)
    assert [f["properties"]["shapeISO"] for f in features] == ["GT-CQ"]


# --- rain layer ----------------------------------------------------------------------------------


def test_rain_geojson_has_one_feature_per_cell_with_contract_properties() -> None:
    site = example_site()
    cell = RainCell(lat=site.lat, lon=site.lon, annual_mm=sum(site.monthly_precip_mm))

    geojson = rain_geojson([cell], "2026-11-14")

    assert geojson["type"] == "FeatureCollection"
    assert geojson["data_version"] == "2026-11-14"
    features = geojson["features"]
    assert isinstance(features, list)
    (feature,) = features
    assert feature["id"] == site.cell_id
    assert feature["geometry"] == site.cell_polygon.model_dump()
    properties = RainCellProperties.model_validate(feature["properties"])
    assert properties.value_mm == pytest.approx(sum(site.monthly_precip_mm))
    assert properties.unit == "mm/año"
    assert "NASA POWER" in properties.source
    assert 50 < properties.resolution_km < 70


# --- catalogs ------------------------------------------------------------------------------------


@pytest.mark.parametrize(
    "seasons",
    ['["primera", "postrera"]', "primera;postrera", "primera|postrera", "primera, postrera"],
)
def test_catalog_csv_accepts_common_list_formats(tmp_path: Path, seasons: str) -> None:
    rows = [{**crop, "seasons": seasons} for crop in example_crops()[:1]]
    write_csv(tmp_path / "crops.csv", rows)

    (entry,) = read_catalog_csv(tmp_path / "crops.csv", CropCatalogEntry)

    assert entry.seasons == ["primera", "postrera"]


def test_catalog_csv_keeps_row_order_and_types(tmp_path: Path) -> None:
    rows = [{**crop, "seasons": ";".join(map(str, crop["seasons"]))} for crop in example_crops()]  # type: ignore[call-overload]
    write_csv(tmp_path / "crops.csv", rows)

    entries = read_catalog_csv(tmp_path / "crops.csv", CropCatalogEntry)

    assert [e.id for e in entries] == [crop["id"] for crop in example_crops()]
    assert entries == [CropCatalogEntry.model_validate(crop) for crop in example_crops()]


def test_catalog_parquet_round_trips_in_row_order(tmp_path: Path) -> None:
    crops = [CropCatalogEntry.model_validate(crop) for crop in example_crops()]
    templates = [
        RotationTemplate.model_validate(t)
        for t in json.loads((EXAMPLES / "rotation_templates.json").read_text("utf-8"))
    ]

    write_catalog_parquet(crops, tmp_path / "crops.parquet")
    write_catalog_parquet(templates, tmp_path / "rotation_templates.parquet")

    for path, model, expected in [
        (tmp_path / "crops.parquet", CropCatalogEntry, crops),
        (tmp_path / "rotation_templates.parquet", RotationTemplate, templates),
    ]:
        with duckdb.connect() as con:
            cursor = con.execute(
                "SELECT * EXCLUDE (file_row_number) "
                "FROM read_parquet(?, file_row_number = true) ORDER BY file_row_number",
                [path.as_posix()],
            )
            names = [c[0] for c in cursor.description or []]
            back = [
                model.model_validate(dict(zip(names, r, strict=True))) for r in cursor.fetchall()
            ]
        assert back == expected


# --- static json ---------------------------------------------------------------------------------


def test_demo_points_are_chiquimula_and_one_outside_point() -> None:
    points = [DemoPoint.model_validate(p) for p in DEMO_POINTS]

    assert [p.id for p in points] == ["chiquimula", "fuera_ciudad_guatemala"]
    assert points[0].location.lat == 14.70
    assert points[0].location.lon == -89.50


def test_write_json_creates_folders_and_keeps_accents(tmp_path: Path) -> None:
    path = tmp_path / "layers" / "x.json"

    write_json({"name_es": "Maíz"}, path)

    assert "Maíz" in path.read_text("utf-8")
    assert json.loads(path.read_text("utf-8")) == {"name_es": "Maíz"}
