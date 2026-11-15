import csv
import json
from pathlib import Path

import duckdb
import pandas as pd  # type: ignore[import-untyped]

from contracts import CropCatalogEntry, DemoPoint, RotationTemplate
from data_pipeline.__main__ import Paths, run
from data_pipeline.parquet_io import read_site_data

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"
VERSION = "2026-11-14"


def write_catalogs(catalog: Path) -> None:
    catalog.mkdir(parents=True)
    for name, fields in [
        ("crop_catalog.json", list(CropCatalogEntry.model_fields)),
        ("rotation_templates.json", list(RotationTemplate.model_fields)),
    ]:
        rows = json.loads((EXAMPLES / name).read_text("utf-8"))
        target = "crops.csv" if name == "crop_catalog.json" else "rotation_templates.csv"
        with (catalog / target).open("w", encoding="utf-8", newline="") as handle:
            writer = csv.DictWriter(handle, fieldnames=fields)
            writer.writeheader()
            for row in rows:
                if "seasons" in row:
                    row["seasons"] = ";".join(row["seasons"])
                writer.writerow(row)


def boundaries() -> dict[str, object]:
    # A strip across two POWER cells (lon -89.375 and -88.75, both at lat 14.5).
    ring = [[-89.5, 14.6], [-88.8, 14.6], [-88.8, 14.7], [-89.5, 14.7], [-89.5, 14.6]]
    return {
        "type": "FeatureCollection",
        "features": [
            {
                "type": "Feature",
                "properties": {"shapeName": "Chiquimula", "shapeISO": "GT-CQ"},
                "geometry": {"type": "Polygon", "coordinates": [ring]},
            }
        ],
    }


def fake_daily(lat: float, lon: float, cache_dir: Path) -> pd.DataFrame:
    index = pd.date_range("1991-01-01", "2020-12-31", freq="D", name="date")
    return pd.DataFrame({"precip_mm": 3.0, "tmax_c": 30.0}, index=index)


def fake_soil(lat: float, lon: float, cache_dir: Path) -> dict[str, float | None]:
    if lon == -88.75:  # pretend SoilGrids has no data here
        return {"clay_pct": None, "sand_pct": None, "ph": None, "soc_g_kg": None}
    return {"clay_pct": 34.4, "sand_pct": 31.2, "ph": 5.9, "soc_g_kg": 38.3}


def run_once(tmp_path: Path) -> Paths:
    paths = Paths(
        cache=tmp_path / "cache",
        catalog=tmp_path / "catalog",
        output=tmp_path / "output",
        web=tmp_path / "web",
    )
    write_catalogs(paths.catalog)
    run(paths, VERSION, boundaries(), fetch_daily=fake_daily, fetch_soil=fake_soil)
    return paths


def test_rain_layer_cells_equal_parquet_cells(tmp_path: Path) -> None:
    paths = run_once(tmp_path)

    sites = read_site_data(paths.output / "sites.parquet")
    rain = json.loads((paths.web / "layers" / "rain.geojson").read_text("utf-8"))

    assert sorted(f["id"] for f in rain["features"]) == sorted(s.cell_id for s in sites)
    assert sorted(s.cell_id for s in sites) == ["14.5_-88.75", "14.5_-89.375"]


def test_every_output_carries_the_same_data_version(tmp_path: Path) -> None:
    paths = run_once(tmp_path)

    sites = read_site_data(paths.output / "sites.parquet")
    rain = json.loads((paths.web / "layers" / "rain.geojson").read_text("utf-8"))
    region = json.loads((paths.web / "region.geojson").read_text("utf-8"))

    assert {s.data_version for s in sites} == {VERSION}
    assert rain["data_version"] == VERSION
    assert region["data_version"] == VERSION


def test_sites_carry_features_soil_and_precomputed_risks(tmp_path: Path) -> None:
    paths = run_once(tmp_path)

    by_id = {s.cell_id: s for s in read_site_data(paths.output / "sites.parquet")}
    golden, no_soil = by_id["14.5_-89.375"], by_id["14.5_-88.75"]

    assert golden.monthly_precip_mm[0] == 93.0  # 3 mm x 31 days
    assert golden.dry_spell_year_share == 0.0
    assert "20 consecutive dry days" in golden.dry_spell_rule
    assert golden.soil.soc_g_kg == 38.3
    assert (golden.soil_sample_lat, golden.soil_sample_lon) == (14.5, -89.375)
    assert [r.id for r in golden.risks] == ["bare_field", "canicula"]
    assert no_soil.soil.ph is None
    assert (no_soil.soil_sample_lat, no_soil.soil_sample_lon) == (None, None)
    assert no_soil.risks[-1].id == "missing_data"


def test_region_catalogs_and_demo_points_are_written(tmp_path: Path) -> None:
    paths = run_once(tmp_path)

    with duckdb.connect() as con:
        rings = con.execute(
            "SELECT ring FROM read_parquet(?)", [(paths.output / "region.parquet").as_posix()]
        ).fetchall()
        crop_ids = con.execute(
            "SELECT id FROM read_parquet(?)", [(paths.output / "crops.parquet").as_posix()]
        ).fetchall()
    assert len(rings) == 1
    assert crop_ids[0] == ("maiz",)
    assert (paths.output / "rotation_templates.parquet").exists()

    crops = json.loads((paths.web / "crops.json").read_text("utf-8"))
    templates = json.loads((paths.web / "rotation_templates.json").read_text("utf-8"))
    points = json.loads((paths.web / "demo_points.json").read_text("utf-8"))
    assert [CropCatalogEntry.model_validate(c).id for c in crops] == [c["id"] for c in crops]
    assert crops[0]["id"] == "maiz"
    assert all(RotationTemplate.model_validate(t) for t in templates)
    assert [DemoPoint.model_validate(p).id for p in points] == [
        "chiquimula",
        "fuera_ciudad_guatemala",
    ]
