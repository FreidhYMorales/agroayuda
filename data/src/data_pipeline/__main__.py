"""Pipeline entry point: uv run --package data-pipeline python -m data_pipeline [--map-layers]

--map-layers writes the web map files that need neither the crop catalog nor the engine:
web/public/data/layers/rain.geojson, region.geojson and demo_points.json, from NASA POWER and
geoBoundaries. The full run (sites Parquet with precomputed risks, catalogs) lands with
engine/src/engine/risks.py, which needs engine.calendar (package 02).

Raw downloads are cached in data/cache/ (gitignored), so a second run works offline.
"""

import argparse
import sys
import time
from collections.abc import Callable, Sequence
from dataclasses import dataclass
from datetime import date
from pathlib import Path
from typing import Any, Final

import httpx
import pandas as pd  # type: ignore[import-untyped]

from data_pipeline import power
from data_pipeline.features import monthly_precip_mm
from data_pipeline.grid import cells_intersecting
from data_pipeline.outputs import (
    DEMO_POINTS,
    RainCell,
    rain_geojson,
    region_geojson,
    region_rings,
    write_json,
)

REPO_ROOT: Final = Path(__file__).resolve().parents[3]
# Chiquimula, Jutiapa, Zacapa, El Progreso, Jalapa
REGION_ISO: Final = frozenset({"GT-CQ", "GT-JU", "GT-ZA", "GT-PR", "GT-JA"})
GEOBOUNDARIES_URL: Final = (
    "https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/GTM/ADM1/"
    "geoBoundaries-GTM-ADM1_simplified.geojson"
)

DailyFetcher = Callable[[float, float, Path], pd.DataFrame]


@dataclass(frozen=True)
class Paths:
    cache: Path = REPO_ROOT / "data" / "cache"
    catalog: Path = REPO_ROOT / "data" / "catalog"
    output: Path = REPO_ROOT / "data" / "output"
    web: Path = REPO_ROOT / "web" / "public" / "data"


def _fetch_daily(lat: float, lon: float, cache: Path) -> pd.DataFrame:
    return power.fetch_daily(lat, lon, cache / "power")


def write_map_layers(
    paths: Paths, data_version: str, boundaries: dict[str, Any], cells: Sequence[RainCell]
) -> None:
    """rain.geojson, region.geojson and demo_points.json under paths.web."""
    write_json(rain_geojson(cells, data_version), paths.web / "layers" / "rain.geojson")
    write_json(
        region_geojson(boundaries, set(REGION_ISO), data_version), paths.web / "region.geojson"
    )
    write_json(DEMO_POINTS, paths.web / "demo_points.json")


def map_layers(
    paths: Paths,
    data_version: str,
    boundaries: dict[str, Any],
    *,
    fetch_daily: DailyFetcher = _fetch_daily,
) -> list[RainCell]:
    """Annual rain normal for every region cell, then the three map files."""
    cells = [
        RainCell(lat, lon, sum(monthly_precip_mm(fetch_daily(lat, lon, paths.cache))))
        for lat, lon in cells_intersecting(region_rings(boundaries, set(REGION_ISO)))
    ]
    write_map_layers(paths, data_version, boundaries, cells)
    return cells


def load_boundaries(paths: Paths) -> dict[str, Any]:
    return power.cached_json(
        paths.cache / "geoboundaries" / "GTM_ADM1_simplified.geojson",
        GEOBOUNDARIES_URL,
        httpx.QueryParams(),
        None,
        time.sleep,
    )


def main(argv: Sequence[str] | None = None) -> None:
    parser = argparse.ArgumentParser(prog="python -m data_pipeline")
    parser.add_argument(
        "--map-layers",
        action="store_true",
        help="only write rain.geojson, region.geojson and demo_points.json",
    )
    args = parser.parse_args(argv)
    if not args.map_layers:
        sys.exit("The full run needs engine/src/engine/risks.py (pending); use --map-layers.")
    paths = Paths()
    cells = map_layers(paths, date.today().isoformat(), load_boundaries(paths))
    print(f"Wrote {len(cells)} rain cells, the region and demo points to {paths.web}")


if __name__ == "__main__":
    main()
