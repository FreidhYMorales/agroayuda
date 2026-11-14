"""SoilGrids 2.0 (ISRIC) point sample at the cell center, scaled to contract units.

REST properties/query, value "mean", one depth (SOIL_DEPTH, see data/README.md). SoilGrids
stores integers: SOC in dg/kg, pH x10, clay and sand in g/kg; dividing by 10 gives g/kg, pH and
%. A point with no data (water, urban, outside the map) gives null fields, never an error.
"""

import time
from collections.abc import Callable
from pathlib import Path
from typing import Any, Final

import httpx

from data_pipeline.power import cached_json

SOILGRIDS_URL: Final = "https://rest.isric.org/soilgrids/v2.0/properties/query"
SOIL_DEPTH: Final = "5-15cm"
# SoilGrids property -> contract field of contracts.Soil
FIELDS: Final = {"clay": "clay_pct", "sand": "sand_pct", "phh2o": "ph", "soc": "soc_g_kg"}
SCALE: Final = 10


def soil_cache_path(lat: float, lon: float, cache_dir: Path) -> Path:
    return cache_dir / f"soilgrids_{float(lat)}_{float(lon)}_{SOIL_DEPTH}.json"


def parse_soilgrids(payload: dict[str, Any]) -> dict[str, int | None]:
    """Raw REST JSON -> {property: mapped integer or None} for the four properties."""
    raw: dict[str, int | None] = dict.fromkeys(FIELDS)
    for layer in payload["properties"]["layers"]:
        if layer["name"] not in FIELDS:
            continue
        for depth in layer["depths"]:
            if depth["label"] == SOIL_DEPTH:
                value = depth["values"].get("mean")
                raw[layer["name"]] = None if value is None else int(value)
    return raw


def scale_soilgrids(raw: dict[str, int | None]) -> dict[str, float | None]:
    """Divide each property by 10 and rename it to the contract field; None stays None."""
    scaled: dict[str, float | None] = {}
    for prop, field in FIELDS.items():
        value = raw.get(prop)
        scaled[field] = None if value is None else value / SCALE
    return scaled


def fetch_soil(
    lat: float,
    lon: float,
    cache_dir: Path,
    *,
    client: httpx.Client | None = None,
    sleep: Callable[[float], None] = time.sleep,
) -> dict[str, float | None]:
    """Scaled soil at one point; reads data/cache/ first, downloads (with backoff) otherwise."""
    params = httpx.QueryParams(
        [
            ("lon", str(float(lon))),
            ("lat", str(float(lat))),
            *(("property", prop) for prop in FIELDS),
            ("depth", SOIL_DEPTH),
            ("value", "mean"),
        ]
    )
    path = soil_cache_path(lat, lon, cache_dir)
    payload = cached_json(path, SOILGRIDS_URL, params, client, sleep)
    return scale_soilgrids(parse_soilgrids(payload))
