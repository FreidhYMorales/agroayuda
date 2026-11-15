import json
from pathlib import Path

import pandas as pd  # type: ignore[import-untyped]
import pytest

from contracts import DemoPoint, RainCellProperties
from data_pipeline.__main__ import Paths, map_layers

VERSION = "2026-11-14"


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
            },
            {
                "type": "Feature",
                "properties": {"shapeName": "Guatemala", "shapeISO": "GT-GU"},
                "geometry": {"type": "Polygon", "coordinates": [ring]},
            },
        ],
    }


def fake_daily(lat: float, lon: float, cache_dir: Path) -> pd.DataFrame:
    index = pd.date_range("1991-01-01", "2020-12-31", freq="D", name="date")
    return pd.DataFrame({"precip_mm": 2.0 if lon == -88.75 else 3.0, "tmax_c": 30.0}, index=index)


def run_layers(tmp_path: Path) -> Paths:
    # No catalog folder at all: the map layers must not need crops.csv or templates.
    paths = Paths(
        cache=tmp_path / "cache",
        catalog=tmp_path / "missing-catalog",
        output=tmp_path / "output",
        web=tmp_path / "web",
    )
    map_layers(paths, VERSION, boundaries(), fetch_daily=fake_daily)
    return paths


def read(path: Path) -> dict[str, object]:
    payload: dict[str, object] = json.loads(path.read_text("utf-8"))
    return payload


def test_rain_layer_has_one_feature_per_region_cell(tmp_path: Path) -> None:
    paths = run_layers(tmp_path)

    rain = read(paths.web / "layers" / "rain.geojson")
    features = rain["features"]
    assert isinstance(features, list)

    assert [f["id"] for f in features] == ["14.5_-89.375", "14.5_-88.75"]
    values = [RainCellProperties.model_validate(f["properties"]).value_mm for f in features]
    # Mean annual total: 3 mm/day and 2 mm/day over 1991-2020 (10958 days in 30 years).
    days_per_year = 10958 / 30
    assert values == [
        pytest.approx(3 * days_per_year, abs=0.1),
        pytest.approx(2 * days_per_year, abs=0.1),
    ]


def test_both_layers_carry_the_same_data_version(tmp_path: Path) -> None:
    paths = run_layers(tmp_path)

    rain = read(paths.web / "layers" / "rain.geojson")
    region = read(paths.web / "region.geojson")
    mask = read(paths.web / "region_mask.geojson")

    assert rain["data_version"] == VERSION
    assert region["data_version"] == VERSION
    assert mask["data_version"] == VERSION
    features = region["features"]
    assert isinstance(features, list)
    assert [f["properties"]["shapeISO"] for f in features] == ["GT-CQ"]


def test_demo_points_are_written(tmp_path: Path) -> None:
    paths = run_layers(tmp_path)

    points = json.loads((paths.web / "demo_points.json").read_text("utf-8"))

    assert [DemoPoint.model_validate(p).id for p in points] == [
        "chiquimula",
        "aguacatan",
        "rabinal",
        "san_martin_jilotepeque",
        "san_jose_del_golfo",
        "canilla",
        "santa_lucia_la_reforma",
        "fuera_ciudad_guatemala",
    ]


def test_map_layers_write_no_parquet(tmp_path: Path) -> None:
    paths = run_layers(tmp_path)

    assert not paths.output.exists()
