"""Point-in-region and NASA POWER grid snapping (pure functions, no new dependencies).

POWER nodes are cell centers: lat = -90 + 0.5 i, lon = -180 + 0.625 j; a cell spans half a step
around its node. The data pipeline must build `cell_id` with the same rule: f"{lat}_{lon}".
"""

import math
from dataclasses import dataclass
from itertools import pairwise
from typing import Final

from contracts import Polygon

LAT_STEP: Final = 0.5
LON_STEP: Final = 0.625
KM_PER_DEGREE: Final = 111.32

Ring = list[list[float]]  # [[lon, lat], ...], closed


@dataclass(frozen=True)
class Cell:
    lat: float
    lon: float
    cell_id: str
    polygon: Polygon


def _nearest_index(value: float, origin: float, step: float) -> int:
    """Round half up (not Python's half-to-even), so edge points always go the same way."""
    return math.floor((value - origin) / step + 0.5)


def snap_to_cell(lat: float, lon: float) -> Cell:
    node_lat = -90 + LAT_STEP * _nearest_index(lat, -90, LAT_STEP)
    node_lon = -180 + LON_STEP * _nearest_index(lon, -180, LON_STEP)
    south, north = node_lat - LAT_STEP / 2, node_lat + LAT_STEP / 2
    west, east = node_lon - LON_STEP / 2, node_lon + LON_STEP / 2
    ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
    return Cell(
        lat=node_lat,
        lon=node_lon,
        cell_id=f"{node_lat}_{node_lon}",
        polygon=Polygon(type="Polygon", coordinates=[ring]),
    )


def cell_resolution_km(lat: float) -> float:
    """Mean side of a POWER cell at this latitude (about 55 x 67 km in the Dry Corridor)."""
    north_south = LAT_STEP * KM_PER_DEGREE
    east_west = LON_STEP * KM_PER_DEGREE * math.cos(math.radians(lat))
    return round((north_south + east_west) / 2, 1)


def point_in_rings(lat: float, lon: float, rings: list[Ring]) -> bool:
    """Even-odd ray casting over every ring: outer rings, holes and MultiPolygon parts alike."""
    inside = False
    for ring in rings:
        for (x1, y1), (x2, y2) in pairwise(ring):
            crosses = (y1 > lat) != (y2 > lat)
            if crosses and lon < (x2 - x1) * (lat - y1) / (y2 - y1) + x1:
                inside = not inside
    return inside
