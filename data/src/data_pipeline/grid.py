"""NASA POWER native grid: node snapping, cell bounds and the cells that intersect the region.

Nodes are cell centers: lat = -90 + 0.5 i, lon = -180 + 0.625 j; a cell spans half a step around
its node. Snapping rounds half up, the same rule as api/src/api/geo.py, so the pipeline and the
API always agree on `cell_id`. Every node coordinate is a multiple of 1/8, so floats are exact.
"""

import math
from itertools import pairwise
from typing import Final

LAT_STEP: Final = 0.5
LON_STEP: Final = 0.625
KM_PER_DEGREE: Final = 111.32

Ring = list[list[float]]  # [[lon, lat], ...], closed
Node = tuple[float, float]  # (lat, lon)
Point = tuple[float, float]  # (lon, lat)


def _index(value: float, origin: float, step: float) -> int:
    """Round half up (not Python's half-to-even), as in the API."""
    return math.floor((value - origin) / step + 0.5)


def snap(lat: float, lon: float) -> tuple[float, float]:
    """Nearest POWER node (lat, lon) to a point."""
    return (
        -90 + LAT_STEP * _index(lat, -90, LAT_STEP),
        -180 + LON_STEP * _index(lon, -180, LON_STEP),
    )


def cell_id(lat: float, lon: float) -> str:
    """API format: node coordinates as Python floats, e.g. "14.5_-89.375"."""
    return f"{float(lat)}_{float(lon)}"


def cell_resolution_km(lat: float) -> float:
    """Mean side of a cell at this latitude, same formula as the API (about 61 km here)."""
    north_south = LAT_STEP * KM_PER_DEGREE
    east_west = LON_STEP * KM_PER_DEGREE * math.cos(math.radians(lat))
    return round((north_south + east_west) / 2, 1)


def cell_bounds(lat: float, lon: float) -> tuple[float, float, float, float]:
    """(min_lon, min_lat, max_lon, max_lat) of the cell centered on the node (lat, lon)."""
    return (lon - LON_STEP / 2, lat - LAT_STEP / 2, lon + LON_STEP / 2, lat + LAT_STEP / 2)


def cell_polygon(lat: float, lon: float) -> dict[str, object]:
    """GeoJSON Polygon of the cell: one closed counterclockwise ring of [lon, lat]."""
    west, south, east, north = cell_bounds(lat, lon)
    ring = [[west, south], [east, south], [east, north], [west, north], [west, south]]
    return {"type": "Polygon", "coordinates": [ring]}


def cells_in_bbox(min_lon: float, min_lat: float, max_lon: float, max_lat: float) -> list[Node]:
    """Every node whose cell touches the bbox, sorted south to north, then west to east."""
    i_min = math.ceil((min_lat + 90) / LAT_STEP - 0.5)
    i_max = math.floor((max_lat + 90) / LAT_STEP + 0.5)
    j_min = math.ceil((min_lon + 180) / LON_STEP - 0.5)
    j_max = math.floor((max_lon + 180) / LON_STEP + 0.5)
    return [
        (-90 + LAT_STEP * i, -180 + LON_STEP * j)
        for i in range(i_min, i_max + 1)
        for j in range(j_min, j_max + 1)
    ]


def _point_in_rings(point: Point, rings: list[Ring]) -> bool:
    """Even-odd ray casting over every ring (outer rings, holes and parts alike)."""
    x, y = point
    inside = False
    for ring in rings:
        for (x1, y1), (x2, y2) in pairwise(ring):
            if (y1 > y) != (y2 > y) and x < x1 + (y - y1) * (x2 - x1) / (y2 - y1):
                inside = not inside
    return inside


def _orientation(a: Point, b: Point, c: Point) -> float:
    return (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0])


def _on_segment(a: Point, b: Point, p: Point) -> bool:
    return min(a[0], b[0]) <= p[0] <= max(a[0], b[0]) and min(a[1], b[1]) <= p[1] <= max(a[1], b[1])


def _segments_intersect(p1: Point, p2: Point, q1: Point, q2: Point) -> bool:
    d1 = _orientation(q1, q2, p1)
    d2 = _orientation(q1, q2, p2)
    d3 = _orientation(p1, p2, q1)
    d4 = _orientation(p1, p2, q2)
    if ((d1 > 0) != (d2 > 0)) and ((d3 > 0) != (d4 > 0)) and 0 not in (d1, d2, d3, d4):
        return True
    return (
        (d1 == 0 and _on_segment(q1, q2, p1))
        or (d2 == 0 and _on_segment(q1, q2, p2))
        or (d3 == 0 and _on_segment(p1, p2, q1))
        or (d4 == 0 and _on_segment(p1, p2, q2))
    )


def _cell_touches_rings(node: Node, rings: list[Ring]) -> bool:
    west, south, east, north = cell_bounds(*node)
    corners: list[Point] = [(west, south), (east, south), (east, north), (west, north)]
    # 1. A region vertex inside the cell.
    for ring in rings:
        for x, y in ring:
            if west <= x <= east and south <= y <= north:
                return True
    # 2. The cell inside the region.
    if _point_in_rings(corners[0], rings):
        return True
    # 3. A region edge crossing a cell edge.
    cell_edges = list(pairwise([*corners, corners[0]]))
    for ring in rings:
        for (x1, y1), (x2, y2) in pairwise(ring):
            for c1, c2 in cell_edges:
                if _segments_intersect((x1, y1), (x2, y2), c1, c2):
                    return True
    return False


def cells_intersecting(rings: list[Ring]) -> list[Node]:
    """Every node whose cell intersects the region rings, in cells_in_bbox order."""
    xs = [x for ring in rings for x, _ in ring]
    ys = [y for ring in rings for _, y in ring]
    candidates = cells_in_bbox(min(xs), min(ys), max(xs), max(ys))
    return [node for node in candidates if _cell_touches_rings(node, rings)]
