"""ADM2 base: municipality selection (name + department), MultiPolygon split, region outputs.

Hand-made GeoJSON only, no network. The real-file test at the bottom reads the geoBoundaries
cache if it is there (data/cache/geoboundaries/) and is skipped otherwise.
"""

import json
from pathlib import Path
from typing import Any

import pytest
from test_pipeline import VERSION, fake_daily, fake_soil, write_catalogs

from data_pipeline.__main__ import ADM2_URL, GEOBOUNDARIES_URL, MUNICIPALITIES, Paths, run
from data_pipeline.grid import _point_in_rings, cells_intersecting
from data_pipeline.outputs import region_geojson, region_rings, select_adm2, split_multipolygons
from data_pipeline.parquet_io import read_site_data

REGION_ISO = {"GT-CQ"}
CACHE = Path(__file__).resolve().parents[2] / "cache" / "geoboundaries"


def square(west: float, south: float, east: float, north: float) -> list[list[list[float]]]:
    return [[[west, south], [east, south], [east, north], [west, north], [west, south]]]


def feature(name: str, geometry: dict[str, Any], iso: str | None = None) -> dict[str, Any]:
    properties = {"shapeName": name}
    if iso is not None:
        properties["shapeISO"] = iso
    return {"type": "Feature", "properties": properties, "geometry": geometry}


def polygon(west: float, south: float, east: float, north: float) -> dict[str, Any]:
    return {"type": "Polygon", "coordinates": square(west, south, east, north)}


def collection(*features: dict[str, Any]) -> dict[str, Any]:
    return {"type": "FeatureCollection", "features": list(features)}


# ADM1: Chiquimula (in the region), Huehuetenango and Quiché (not whole in the region).
ADM1 = collection(
    feature("Chiquimula", polygon(-89.5, 14.6, -88.8, 14.7), "GT-CQ"),
    feature("Huehuetenango", polygon(-92.0, 15.2, -91.0, 16.0), "GT-HU"),
    feature("Quiché", polygon(-91.0, 15.2, -90.0, 16.0), "GT-QC"),
)

AGUACATAN = feature("Aguacatán", polygon(-91.4, 15.3, -91.2, 15.5))  # in Huehuetenango
MALACATANCITO = feature("Malacatancito", polygon(-91.9, 15.3, -91.7, 15.5))  # in Huehuetenango
CHIANTLA = feature("Chiantla", polygon(-91.9, 15.7, -91.7, 15.9))  # in Huehuetenango, not listed
SAN_PEDRO_HU = feature("San Pedro", polygon(-91.6, 15.6, -91.5, 15.7))  # in Huehuetenango
SAN_PEDRO_QC = feature("San Pedro", polygon(-90.6, 15.6, -90.5, 15.7))  # in Quiché
TWO_PARTS = feature(
    "Huehuetenango",  # the municipality shares its name with the department
    {
        "type": "MultiPolygon",
        "coordinates": [square(-91.5, 15.9, -91.4, 15.95), square(-91.3, 15.9, -91.2, 15.95)],
    },
)


def test_urls_are_pinned_to_the_same_geoboundaries_commit() -> None:
    assert "/raw/9469f09/" in GEOBOUNDARIES_URL
    assert ADM2_URL.endswith("/GTM/ADM2/geoBoundaries-GTM-ADM2_simplified.geojson")
    assert ADM2_URL.replace("ADM2", "ADM1") == GEOBOUNDARIES_URL


def test_the_municipality_list_starts_empty_in_the_base_pr() -> None:
    assert MUNICIPALITIES == ()


# --- selection -----------------------------------------------------------------------------------


def test_selection_keeps_only_the_listed_municipalities() -> None:
    adm2 = collection(AGUACATAN, MALACATANCITO, CHIANTLA)

    selected = select_adm2(
        adm2, ADM1, [("Aguacatán", "Huehuetenango"), ("Malacatancito", "Huehuetenango")]
    )

    assert [f["properties"]["shapeName"] for f in selected] == ["Aguacatán", "Malacatancito"]


def test_selection_ignores_case_and_accents() -> None:
    selected = select_adm2(collection(AGUACATAN), ADM1, [("AGUACATAN", "huehuetenango")])

    assert [f["properties"]["shapeName"] for f in selected] == ["Aguacatán"]


def test_missing_name_raises_naming_it_and_its_department() -> None:
    with pytest.raises(ValueError, match=r"'Jacaltenango' \(Huehuetenango\)"):
        select_adm2(collection(AGUACATAN), ADM1, [("Jacaltenango", "Huehuetenango")])


def test_name_found_only_in_another_department_counts_as_missing() -> None:
    with pytest.raises(ValueError, match="not found"):
        select_adm2(collection(SAN_PEDRO_QC), ADM1, [("San Pedro", "Huehuetenango")])


def test_duplicate_name_in_the_same_department_raises() -> None:
    twin = feature("Aguacatán", polygon(-91.1, 15.3, -91.05, 15.4))

    with pytest.raises(ValueError, match="matches 2 ADM2 features"):
        select_adm2(collection(AGUACATAN, twin), ADM1, [("Aguacatán", "Huehuetenango")])


def test_same_name_in_other_department_selects_only_the_listed_one() -> None:
    adm2 = collection(SAN_PEDRO_HU, SAN_PEDRO_QC)

    selected = select_adm2(adm2, ADM1, [("San Pedro", "Quiché")])

    assert selected == [SAN_PEDRO_QC]


def test_a_municipality_of_a_whole_covered_department_raises() -> None:
    inside_chiquimula = feature("Quezaltepeque", polygon(-89.3, 14.62, -89.2, 14.68))

    with pytest.raises(ValueError, match="already inside a covered department"):
        select_adm2(
            collection(inside_chiquimula), ADM1, [("Quezaltepeque", "Chiquimula")], {"GT-CQ"}
        )


def test_a_municipality_list_without_adm2_boundaries_raises() -> None:
    with pytest.raises(ValueError, match="needs the ADM2 boundaries"):
        region_rings(ADM1, REGION_ISO, None, [("Aguacatán", "Huehuetenango")])


# --- MultiPolygon split --------------------------------------------------------------------------


def test_split_makes_one_polygon_feature_per_part_keeping_properties() -> None:
    parts = split_multipolygons([TWO_PARTS, AGUACATAN])

    assert [f["geometry"]["type"] for f in parts] == ["Polygon", "Polygon", "Polygon"]
    assert [f["properties"]["shapeName"] for f in parts] == [
        "Huehuetenango",
        "Huehuetenango",
        "Aguacatán",
    ]


def test_region_geojson_has_only_polygons_for_a_listed_multipolygon() -> None:
    geojson = region_geojson(
        ADM1, REGION_ISO, VERSION, collection(TWO_PARTS), [("Huehuetenango", "Huehuetenango")]
    )

    adm2_features = geojson["features"][1:]  # type: ignore[index]
    assert [f["geometry"]["type"] for f in adm2_features] == ["Polygon", "Polygon"]
    assert [f["properties"]["shapeName"] for f in adm2_features] == ["Huehuetenango"] * 2


# --- region rings and GeoJSON --------------------------------------------------------------------


def region_inputs() -> tuple[dict[str, Any], list[tuple[str, str]]]:
    adm2 = collection(AGUACATAN, CHIANTLA)
    return adm2, [("Aguacatán", "Huehuetenango")]


def _even_odd(point: tuple[float, float], rings: list[list[list[float]]]) -> bool:
    return _point_in_rings(point, rings)


def test_region_rings_hold_adm1_and_adm2_and_cover_the_municipality() -> None:
    adm2, listed = region_inputs()

    rings = region_rings(ADM1, REGION_ISO, adm2, listed)

    assert len(rings) == 2
    assert _even_odd((-89.2, 14.65), rings)  # inside Chiquimula (ADM1)
    assert _even_odd((-91.3, 15.4), rings)  # inside Aguacatán (ADM2)
    assert not _even_odd((-91.8, 15.8), rings)  # Chiantla: unlisted neighbour stays outside


def test_region_rings_without_a_list_equal_the_adm1_rings() -> None:
    assert region_rings(ADM1, REGION_ISO) == region_rings(ADM1, REGION_ISO, None, [])


def test_region_geojson_has_both_levels_with_name_iso_and_data_version() -> None:
    adm2, listed = region_inputs()

    geojson = region_geojson(ADM1, REGION_ISO, VERSION, adm2, listed)

    assert geojson["data_version"] == VERSION
    features = geojson["features"]
    assert [f["properties"] for f in features] == [  # type: ignore[attr-defined]
        {"shapeName": "Chiquimula", "shapeISO": "GT-CQ"},
        {"shapeName": "Aguacatán", "shapeISO": ""},
    ]


def test_adm1_border_that_does_not_share_vertices_with_the_municipality_stays_covered() -> None:
    """Lead's note: ADM2 vertices need not match ADM1's. Chiquimula and a neighbouring listed
    municipality overlap by a 0.001-degree sliver and leave a gap elsewhere; interior points of
    both stay inside the region and the unlisted neighbour stays outside."""
    adm1 = collection(
        feature("Chiquimula", polygon(-89.5, 14.6, -88.8, 14.7), "GT-CQ"),
        feature("Zacapa", polygon(-88.8, 14.6, -88.0, 14.7), "GT-ZA"),
        feature("Quiché", polygon(-90.5, 14.6, -89.5, 14.7), "GT-QC"),
    )
    neighbour = feature("Ipala", polygon(-89.501, 14.6, -89.9, 14.69))  # touches Chiquimula
    unlisted = feature("Uspantán", polygon(-90.4, 14.6, -90.0, 14.7))

    rings = region_rings(adm1, REGION_ISO, collection(neighbour, unlisted), [("Ipala", "Quiché")])

    assert _even_odd((-89.2, 14.65), rings)
    assert _even_odd((-89.7, 14.65), rings)
    assert not _even_odd((-90.2, 14.65), rings)


# --- cells ---------------------------------------------------------------------------------------


def test_disjoint_regions_do_not_get_cells_from_the_gap_between_them() -> None:
    west = square(-92.0, 15.2, -91.5, 15.7)[0]
    east = square(-88.9, 14.6, -88.4, 15.1)[0]

    cells = cells_intersecting([west, east])

    assert cells  # both squares have cells
    assert all(not (-91.0 < lon < -89.5) for _, lon in cells)  # none from the gap
    assert (14.5, -89.375) not in cells


# --- pipeline ------------------------------------------------------------------------------------


def test_run_writes_a_site_for_a_cell_of_the_listed_municipality(tmp_path: Path) -> None:
    paths = Paths(
        cache=tmp_path / "cache",
        catalog=tmp_path / "catalog",
        output=tmp_path / "output",
        web=tmp_path / "web",
    )
    write_catalogs(paths.catalog)
    adm2, listed = collection(AGUACATAN), [("Aguacatán", "Huehuetenango")]

    sites = run(
        paths,
        VERSION,
        ADM1,
        adm2=adm2,
        municipalities=listed,
        fetch_daily=fake_daily,
        fetch_soil=fake_soil,
    )

    written = {s.cell_id for s in read_site_data(paths.output / "sites.parquet")}
    assert "15.5_-91.25" in written  # the cell of Aguacatán
    assert {s.cell_id for s in sites} == written
    region = json.loads((paths.web / "region.geojson").read_text("utf-8"))
    names = [f["properties"]["shapeName"] for f in region["features"]]
    assert names == ["Chiquimula", "Aguacatán"]


# --- real files (skipped when the geoBoundaries cache is absent) ---------------------------------


@pytest.mark.skipif(
    not (CACHE / "GTM_ADM1_simplified.geojson").exists()
    or not (CACHE / "GTM_ADM2_simplified.geojson").exists(),
    reason="geoBoundaries ADM1/ADM2 not cached in data/cache/geoboundaries/",
)
def test_real_department_and_neighbouring_municipality_keep_the_region_whole() -> None:
    """Lead's note: real ADM1 and ADM2 borders need not share vertices. El Progreso (whole
    department) and San José del Golfo (Guatemala), a municipality on its border: adding the
    municipality must keep every El Progreso cell and add cells, never lose any."""
    adm1 = json.loads((CACHE / "GTM_ADM1_simplified.geojson").read_text("utf-8"))
    adm2 = json.loads((CACHE / "GTM_ADM2_simplified.geojson").read_text("utf-8"))
    iso = {"GT-PR"}
    listed = [("San José del Golfo", "Guatemala")]

    base_rings = region_rings(adm1, iso)
    rings = region_rings(adm1, iso, adm2, listed)
    base_cells = set(cells_intersecting(base_rings))
    cells = set(cells_intersecting(rings))

    assert len(rings) > len(base_rings)
    assert base_cells <= cells
    geojson = region_geojson(adm1, iso, VERSION, adm2, listed)
    adm2_features = geojson["features"][1:]  # type: ignore[index]
    assert {f["geometry"]["type"] for f in adm2_features} == {"Polygon"}
