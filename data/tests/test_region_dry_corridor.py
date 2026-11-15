"""Package 06: the rest of the Dry Corridor municipalities (SESAN 2016, Anexo 1).

Uses the recorded real geoBoundaries subset (ADM1 + ADM2 at commit 9469f09), no network. The
south-coast departments of the annex are left out by the lead's decision (see
docs/work-packages/06-dry-corridor-rest.md).
"""

import json
from itertools import pairwise
from pathlib import Path
from typing import Any

from test_pipeline import VERSION, fake_daily, fake_soil, write_catalogs

from data_pipeline.__main__ import MUNICIPALITIES, Paths, run
from data_pipeline.grid import _point_in_rings, cell_id
from data_pipeline.outputs import (
    DEMO_POINTS,
    _rings_of,
    region_mask_geojson,
    region_rings,
    select_adm2,
)
from data_pipeline.parquet_io import read_site_data

RECORDED = Path(__file__).resolve().parent / "fixtures" / "geoboundaries_region_subset.json"
COVERED_ISO = {"GT-CQ", "GT-JU", "GT-ZA", "GT-PR", "GT-JA"}

# Anexo 1, pp. 28-30, spelled as in geoBoundaries ADM2.
DRY_CORRIDOR_REST = [
    ("Cubulco", "Baja Verapaz"),
    ("El Chol", "Baja Verapaz"),
    ("Granados", "Baja Verapaz"),
    ("Rabinal", "Baja Verapaz"),
    ("Salamá", "Baja Verapaz"),
    ("San Jerónimo", "Baja Verapaz"),
    ("San Miguel Chicaj", "Baja Verapaz"),
    ("San José Poaquil", "Chimaltenango"),
    ("San Martín Jilotepeque", "Chimaltenango"),
    ("Comalapa", "Chimaltenango"),
    ("Chuarrancho", "Guatemala"),
    ("Palencia", "Guatemala"),
    ("San José del Golfo", "Guatemala"),
    ("San Pedro Ayampuc", "Guatemala"),
    ("San Raimundo", "Guatemala"),
    ("Canillá", "Quiché"),
    ("Chicamán", "Quiché"),
    ("Joyabaj", "Quiché"),
    ("Sacapulas", "Quiché"),
    ("San Andrés Sajcabajá", "Quiché"),
    ("San Antonio Ilotenango", "Quiché"),
    ("San Bartolomé Jocotenango", "Quiché"),
    ("San Pedro Jocopilas", "Quiché"),
    ("Zacualpa", "Quiché"),
    ("Uspantán", "Quiché"),
    ("Momostenango", "Totonicapán"),
    ("Santa Lucía La Reforma", "Totonicapán"),
    ("Santa María Chiquimula", "Totonicapán"),
    ("San Bartolo", "Totonicapán"),
]
NEW_DEMO_POINTS = {
    "rabinal": "Rabinal, Baja Verapaz",
    "san_martin_jilotepeque": "San Martín Jilotepeque, Chimaltenango",
    "san_jose_del_golfo": "San José del Golfo, Guatemala",
    "canilla": "Canillá, Quiché",
    "santa_lucia_la_reforma": "Santa Lucía La Reforma, Totonicapán",
}


def recorded() -> dict[str, Any]:
    data: dict[str, Any] = json.loads(RECORDED.read_text("utf-8"))
    return data


def rings_with_the_list() -> list[list[list[float]]]:
    data = recorded()
    return region_rings(data["adm1"], COVERED_ISO, data["adm2"], MUNICIPALITIES)


def inside(location: dict[str, float], rings: list[list[list[float]]]) -> bool:
    return _point_in_rings((location["lon"], location["lat"]), rings)


def test_the_list_has_the_cited_municipalities_without_the_south_coast() -> None:
    rest = [m for m in MUNICIPALITIES if m[1] != "Huehuetenango"]

    assert rest == DRY_CORRIDOR_REST
    south_coast = {"Escuintla", "Retalhuleu", "San Marcos", "Santa Rosa", "Suchitepéquez"}
    assert not {department for _, department in MUNICIPALITIES} & south_coast


def test_only_the_listed_features_are_selected() -> None:
    """The recorded subset also holds Purulhá (Baja Verapaz) and both San Pedro Sacatepéquez."""
    data = recorded()

    selected = select_adm2(data["adm2"], data["adm1"], DRY_CORRIDOR_REST, COVERED_ISO)

    names = [f["properties"]["shapeName"] for f in selected]
    assert names == [name for name, _ in DRY_CORRIDOR_REST]
    assert "Purulhá" not in names


def test_a_repeated_name_selects_only_the_listed_department() -> None:
    """San Pedro Sacatepéquez exists in Guatemala and in San Marcos."""
    data = recorded()

    [feature] = select_adm2(data["adm2"], data["adm1"], [("San Pedro Sacatepéquez", "Guatemala")])
    [other] = select_adm2(data["adm2"], data["adm1"], [("San Pedro Sacatepéquez", "San Marcos")])

    assert feature["geometry"] != other["geometry"]
    assert _point_in_rings((-90.64, 14.68), _rings_of(feature["geometry"]))  # its town


def test_a_new_municipality_is_inside_and_an_unlisted_neighbour_is_not() -> None:
    rings = rings_with_the_list()

    assert inside({"lat": 15.08, "lon": -90.50}, rings)  # Rabinal
    assert not inside({"lat": 15.21, "lon": -89.93}, rings)  # Purulhá, not in the annex


def test_every_new_demo_point_is_inside_and_the_others_keep_their_place() -> None:
    rings = rings_with_the_list()
    points = {p["id"]: p for p in DEMO_POINTS}

    for point_id, name in NEW_DEMO_POINTS.items():
        assert points[point_id]["name_es"] == name
        assert inside(points[point_id]["location"], rings), point_id
    assert DEMO_POINTS[0]["id"] == "chiquimula"
    assert inside(points["aguacatan"]["location"], rings)
    assert not inside(points["fuera_ciudad_guatemala"]["location"], rings)


def written_cells(tmp_path: Path, municipalities: list[tuple[str, str]]) -> set[str]:
    paths = Paths(
        cache=tmp_path / "cache",
        catalog=tmp_path / "catalog",
        output=tmp_path / "output",
        web=tmp_path / "web",
    )
    write_catalogs(paths.catalog)
    data = recorded()
    run(
        paths,
        VERSION,
        data["adm1"],
        adm2=data["adm2"],
        municipalities=municipalities,
        fetch_daily=fake_daily,
        fetch_soil=fake_soil,
    )
    return {s.cell_id for s in read_site_data(paths.output / "sites.parquet")}


def test_run_writes_sites_for_cells_only_the_new_municipalities_reach(tmp_path: Path) -> None:
    huehuetenango_only = [m for m in MUNICIPALITIES if m[1] == "Huehuetenango"]

    before = written_cells(tmp_path / "before", huehuetenango_only)
    after = written_cells(tmp_path / "after", list(MUNICIPALITIES))

    # Recorded subset: 14 cells before, 16 after; the new ones are north Quiché / Baja Verapaz
    # (Uspantán, Chicamán, Cubulco) and south Chimaltenango / Totonicapán.
    assert after - before == {cell_id(15.5, -90.625), cell_id(14.5, -91.25)}


def _segments_cross(a: list[float], b: list[float], c: list[float], d: list[float]) -> bool:
    def side(p: list[float], q: list[float], r: list[float]) -> float:
        return (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])

    return side(c, d, a) * side(c, d, b) < 0 and side(a, b, c) * side(a, b, d) < 0


def test_map_mask_holes_never_cross_on_the_real_borders() -> None:
    """Real ADM1 and ADM2 borders do not share vertices; crossing holes make an invalid polygon
    that MapLibre draws as dark wedges (seen on the phase C preview)."""
    holes = region_mask_geojson(
        rings_with_the_list(), VERSION
    )[
        "features"
    ][
        0
    ][
        "geometry"
    ][  # type: ignore[index]
        "coordinates"
    ][1:]
    segments = [(index, a, b) for index, hole in enumerate(holes) for a, b in pairwise(hole)]

    crossings = [
        (s[0], t[0])
        for i, s in enumerate(segments)
        for t in segments[i + 1 :]
        if s[0] != t[0] and _segments_cross(s[1], s[2], t[1], t[2])
    ]

    assert len(holes) >= 2  # Huehuetenango is apart from the eastern departments
    assert crossings == []
