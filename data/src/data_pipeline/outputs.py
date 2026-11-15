"""Pipeline outputs: Parquet for the API (data/output/), static files for web/public/data/.

Parquet is written with DuckDB and an explicit DDL per contract (no pyarrow), as in
parquet_io.py. Every static GeoJSON carries a top-level "data_version" member; sites.parquet
carries the same value per row (written by parquet_io.write_site_data).
"""

import csv
import json
import unicodedata
from collections.abc import Iterable, Sequence
from dataclasses import dataclass
from itertools import pairwise
from pathlib import Path
from typing import Any, Final

import duckdb
from pydantic import BaseModel

from contracts import CropCatalogEntry, RainCellProperties, RotationTemplate
from data_pipeline.grid import Ring, _point_in_rings, cell_id, cell_polygon, cell_resolution_km

RAIN_SOURCE: Final = "NASA POWER (PRECTOTCORR diario, 1991-2020)"

# Chiquimula (golden point) + one point outside the region (named cut 3).
DEMO_POINTS: Final[list[dict[str, Any]]] = [
    {"id": "chiquimula", "name_es": "Chiquimula", "location": {"lat": 14.70, "lon": -89.50}},
    # A point well inside the Aguacatán polygon (geoBoundaries ADM2), not the town itself.
    {
        "id": "aguacatan",
        "name_es": "Aguacatán, Huehuetenango",
        "location": {"lat": 15.33, "lon": -91.23},
    },
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


Feature = dict[str, Any]
Municipality = tuple[str, str]  # (municipality, department), both as the source spells them


def _selected(boundaries: dict[str, Any], iso_codes: set[str]) -> list[Feature]:
    return [f for f in boundaries["features"] if f["properties"]["shapeISO"] in iso_codes]


def _rings_of(geometry: dict[str, Any]) -> list[Ring]:
    if geometry["type"] == "Polygon":
        return [list(ring) for ring in geometry["coordinates"]]
    if geometry["type"] == "MultiPolygon":
        return [list(ring) for polygon in geometry["coordinates"] for ring in polygon]
    raise ValueError(f"unsupported geometry {geometry['type']}")


def _norm(name: str) -> str:
    """Case- and accent-insensitive key: "Aguacatán" == "AGUACATAN"."""
    decomposed = unicodedata.normalize("NFD", name)
    stripped = "".join(c for c in decomposed if not unicodedata.combining(c))
    return " ".join(stripped.casefold().split())


def split_multipolygons(features: Iterable[Feature]) -> list[Feature]:
    """One Polygon feature per part of every MultiPolygon, each keeping the properties.

    The web map (`regionBounds`) reads only Polygon geometries.
    """
    result: list[Feature] = []
    for feature in features:
        geometry = feature["geometry"]
        if geometry["type"] == "MultiPolygon":
            for part in geometry["coordinates"]:
                result.append(
                    {
                        **feature,
                        "properties": dict(feature["properties"]),
                        "geometry": {"type": "Polygon", "coordinates": part},
                    }
                )
        else:
            result.append(feature)
    return result


def _department_of(feature: Feature, departments: Sequence[Feature]) -> Feature | None:
    """The ADM1 feature that holds most vertices of an ADM2 feature.

    geoBoundaries ADM2 has no department attribute, and its borders need not share vertices
    with ADM1 (a simplified vertex can fall just outside), so we vote with every vertex.
    """
    vertices = [(x, y) for ring in _rings_of(feature["geometry"]) for x, y in ring]
    best, best_votes = None, 0
    for department in departments:
        rings = _rings_of(department["geometry"])
        votes = sum(1 for vertex in vertices if _point_in_rings(vertex, rings))
        if votes > best_votes:
            best, best_votes = department, votes
    return best


def select_adm2(
    adm2: dict[str, Any],
    adm1: dict[str, Any],
    municipalities: Sequence[Municipality],
    covered_iso: frozenset[str] | set[str] = frozenset(),
) -> list[Feature]:
    """The ADM2 features of the listed (municipality, department) pairs, in list order.

    Matching is on name AND department because names repeat across departments. Fails loudly
    if an entry matches no feature or more than one, or if its department is already in the
    region as a whole ADM1 (the rings would overlap and the even-odd rule would cancel them).
    """
    departments = adm1["features"]
    selected: list[Feature] = []
    for municipality, department in municipalities:
        wanted = _norm(municipality)
        named = [f for f in adm2["features"] if _norm(f["properties"]["shapeName"]) == wanted]
        in_department = []
        for feature in named:
            parent = _department_of(feature, departments)
            if parent and _norm(parent["properties"]["shapeName"]) == _norm(department):
                in_department.append((feature, parent))
        label = f"{municipality!r} ({department})"
        if not in_department:
            raise ValueError(f"municipality {label} not found in the ADM2 boundaries")
        if len(in_department) > 1:
            raise ValueError(f"municipality {label} matches {len(in_department)} ADM2 features")
        feature, parent = in_department[0]
        if parent["properties"]["shapeISO"] in covered_iso:
            raise ValueError(f"municipality {label} is already inside a covered department")
        selected.append(feature)
    return selected


def _region_features(
    boundaries: dict[str, Any],
    iso_codes: set[str],
    adm2: dict[str, Any] | None,
    municipalities: Sequence[Municipality],
) -> list[Feature]:
    """Whole ADM1 departments plus the listed ADM2 municipalities (split into Polygons)."""
    features = _selected(boundaries, iso_codes)
    if municipalities:
        if adm2 is None:
            raise ValueError("a municipality list needs the ADM2 boundaries")
        listed = select_adm2(adm2, boundaries, municipalities, iso_codes)
        features = [*features, *split_multipolygons(listed)]
    return features


def region_rings(
    boundaries: dict[str, Any],
    iso_codes: set[str],
    adm2: dict[str, Any] | None = None,
    municipalities: Sequence[Municipality] = (),
) -> list[Ring]:
    """Every ring (outer and holes) of the chosen ADM1 and ADM2 features, for the even-odd rule."""
    features = _region_features(boundaries, iso_codes, adm2, municipalities)
    return [ring for f in features for ring in _rings_of(f["geometry"])]


def region_geojson(
    boundaries: dict[str, Any],
    iso_codes: set[str],
    data_version: str,
    adm2: dict[str, Any] | None = None,
    municipalities: Sequence[Municipality] = (),
) -> dict[str, object]:
    """FeatureCollection of the chosen departments and municipalities for the web map."""
    features = [
        {
            "type": "Feature",
            "properties": {
                "shapeName": f["properties"]["shapeName"],
                "shapeISO": f["properties"].get("shapeISO") or "",
            },
            "geometry": f["geometry"],
        }
        for f in _region_features(boundaries, iso_codes, adm2, municipalities)
    ]
    return {"type": "FeatureCollection", "data_version": data_version, "features": features}


def dissolve(rings: Sequence[Ring]) -> list[Ring]:
    """Merge polygons that share borders into their outlines, without a geometry library.

    geoBoundaries' simplified departments share identical border vertices, so an edge used by
    two rings is an inner border: drop it, then chain the remaining edges back into rings.
    Directions are kept, so counterclockwise inputs give counterclockwise outlines.
    """
    Point = tuple[float, float]
    uses: dict[frozenset[Point], int] = {}
    for ring in rings:
        for a, b in pairwise(ring):
            key = frozenset({(a[0], a[1]), (b[0], b[1])})
            uses[key] = uses.get(key, 0) + 1
    next_points: dict[Point, list[Point]] = {}
    for ring in rings:
        for a, b in pairwise(ring):
            start, end = (a[0], a[1]), (b[0], b[1])
            if uses[frozenset({start, end})] == 1:
                next_points.setdefault(start, []).append(end)
    outlines: list[Ring] = []
    while next_points:
        start = next(iter(next_points))
        outline = [start]
        current = start
        while True:
            following = next_points[current].pop()
            if not next_points[current]:
                del next_points[current]
            outline.append(following)
            current = following
            if current == start:
                break
        outlines.append([[x, y] for x, y in outline])
    return outlines


def region_mask_geojson(rings: Sequence[Ring], data_version: str) -> dict[str, object]:
    """World ring with the dissolved region as holes (clockwise), to dim the outside area."""
    world = [[-180.0, -90.0], [180.0, -90.0], [180.0, 90.0], [-180.0, 90.0], [-180.0, -90.0]]
    holes = []
    for outline in dissolve(rings):
        area = sum(a[0] * b[1] - b[0] * a[1] for a, b in pairwise(outline))
        holes.append(outline if area < 0 else outline[::-1])
    feature = {
        "type": "Feature",
        "properties": {},
        "geometry": {"type": "Polygon", "coordinates": [world, *holes]},
    }
    return {"type": "FeatureCollection", "data_version": data_version, "features": [feature]}


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
