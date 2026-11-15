"""Pipeline outputs: Parquet for the API (data/output/), static files for web/public/data/.

Parquet is written with DuckDB and an explicit DDL per contract (no pyarrow), as in
parquet_io.py. Every static GeoJSON carries a top-level "data_version" member; sites.parquet
carries the same value per row (written by parquet_io.write_site_data).
"""

import csv
import json
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Final

import duckdb
from pydantic import BaseModel

from contracts import CropCatalogEntry, RainCellProperties, RotationTemplate
from data_pipeline.grid import Ring, cell_id, cell_polygon, cell_resolution_km

RAIN_SOURCE: Final = "NASA POWER (PRECTOTCORR diario, 1991-2020)"

# Chiquimula (golden point) + one point outside the region (named cut 3).
DEMO_POINTS: Final[list[dict[str, Any]]] = [
    {"id": "chiquimula", "name_es": "Chiquimula", "location": {"lat": 14.70, "lon": -89.50}},
    {
        "id": "fuera_ciudad_guatemala",
        "name_es": "Ciudad de Guatemala (fuera de la región)",
        "location": {"lat": 14.63, "lon": -90.51},
    },
]

# Column order must match the field order of each contract model.
CATALOG_DDL: Final[dict[type[BaseModel], str]] = {
    CropCatalogEntry: """
        CREATE TABLE catalog (
            id VARCHAR, name_es VARCHAR, icon VARCHAR, seasons VARCHAR[], cycle_days BIGINT,
            water_need VARCHAR, n_fixing BOOLEAN, root_depth VARCHAR, erosion_cover VARCHAR,
            drought_tolerance VARCHAR, market_tier VARCHAR, local_source BOOLEAN, source VARCHAR
        )""",
    RotationTemplate: """
        CREATE TABLE catalog (
            id VARCHAR, primera VARCHAR, postrera VARCHAR, description_es VARCHAR, source VARCHAR
        )""",
}
LIST_SEPARATORS: Final = (";", "|", ",")


# --- region --------------------------------------------------------------------------------------


def _selected(boundaries: dict[str, Any], iso_codes: set[str]) -> list[dict[str, Any]]:
    return [f for f in boundaries["features"] if f["properties"]["shapeISO"] in iso_codes]


def _rings_of(geometry: dict[str, Any]) -> list[Ring]:
    if geometry["type"] == "Polygon":
        return [list(ring) for ring in geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return [list(ring) for polygon in geometry["coordinates"] for ring in polygon]
    raise ValueError(f"unsupported geometry {geometry['type']}")


def region_rings(boundaries: dict[str, Any], iso_codes: set[str]) -> list[Ring]:
    """Every ring (outer and holes) of the chosen ADM1 features, for the even-odd rule."""
    return [ring for f in _selected(boundaries, iso_codes) for ring in _rings_of(f["geometry"])]


def region_geojson(
    boundaries: dict[str, Any], iso_codes: set[str], data_version: str
) -> dict[str, object]:
    """FeatureCollection of the chosen departments for the web map."""
    features = [
        {
            "type": "Feature",
            "properties": {
                "shapeName": f["properties"]["shapeName"],
                "shapeISO": f["properties"]["shapeISO"],
            },
            "geometry": f["geometry"],
        }
        for f in _selected(boundaries, iso_codes)
    ]
    return {"type": "FeatureCollection", "data_version": data_version, "features": features}


def write_region_parquet(rings: Sequence[Ring], path: Path) -> None:
    """One row per ring, column `ring` DOUBLE[][] of [lon, lat] (format fixed by the lead)."""
    with duckdb.connect() as con:
        con.execute("CREATE TABLE region (ring DOUBLE[][])")
        con.executemany("INSERT INTO region VALUES (?)", [[ring] for ring in rings])
        con.execute("COPY region TO ? (FORMAT parquet)", [path.as_posix()])


# --- rain layer ----------------------------------------------------------------------------------


@dataclass(frozen=True)
class RainCell:
    """What the rain layer needs from one POWER cell: its node and the annual rain normal."""

    lat: float
    lon: float
    annual_mm: float  # sum of monthly_precip_mm, 1991-2020


def rain_geojson(cells: Iterable[RainCell], data_version: str) -> dict[str, object]:
    """One Polygon feature per cell (feature id = cell_id) with RainCellProperties."""
    features = []
    for cell in cells:
        properties = RainCellProperties(
            value_mm=round(cell.annual_mm, 1),
            unit="mm/año",
            source=RAIN_SOURCE,
            resolution_km=cell_resolution_km(cell.lat),
        )
        features.append(
            {
                "type": "Feature",
                "id": cell_id(cell.lat, cell.lon),
                "properties": properties.model_dump(),
                "geometry": cell_polygon(cell.lat, cell.lon),
            }
        )
    return {"type": "FeatureCollection", "data_version": data_version, "features": features}


# --- catalogs ------------------------------------------------------------------------------------


def _split_list(cell: str) -> list[str]:
    text = cell.strip()
    if text.startswith("["):
        values: list[str] = json.loads(text)
        return values
    for separator in LIST_SEPARATORS:
        if separator in text:
            return [part.strip() for part in text.split(separator) if part.strip()]
    return [text] if text else []


def read_catalog_csv[M: BaseModel](path: Path, model: type[M]) -> list[M]:
    """CSV rows as validated models, in file order. List cells: JSON list or ; | , separated."""
    list_fields = {
        name
        for name, field in model.model_fields.items()
        if getattr(field.annotation, "__origin__", None) is list
    }
    with path.open(encoding="utf-8", newline="") as handle:
        rows = list(csv.DictReader(handle))
    return [
        model.model_validate(
            {key: _split_list(value) if key in list_fields else value for key, value in row.items()}
        )
        for row in rows
    ]


def write_catalog_parquet(entries: Sequence[BaseModel], path: Path) -> None:
    """crops.parquet / rotation_templates.parquet: one schema each, rows in input order."""
    model = type(entries[0])
    fields = list(model.model_fields)
    placeholders = ", ".join("?" for _ in fields)
    with duckdb.connect() as con:
        con.execute(CATALOG_DDL[model])
        con.executemany(
            f"INSERT INTO catalog VALUES ({placeholders})",
            [[entry.model_dump()[name] for name in fields] for entry in entries],
        )
        con.execute("COPY catalog TO ? (FORMAT parquet)", [path.as_posix()])


# --- static json ---------------------------------------------------------------------------------


def write_json(payload: object, path: Path) -> None:
    """UTF-8 JSON (accents kept), parent folders created, LF line endings."""
    path.parent.mkdir(parents=True, exist_ok=True)
    text = json.dumps(payload, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8", newline="\n")
