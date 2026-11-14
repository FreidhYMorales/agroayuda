import pytest

from api.geo import cell_resolution_km, point_in_rings, snap_to_cell

SQUARE = [[-90.0, 14.0], [-89.0, 14.0], [-89.0, 15.0], [-90.0, 15.0], [-90.0, 14.0]]
HOLE = [[-89.6, 14.4], [-89.4, 14.4], [-89.4, 14.6], [-89.6, 14.6], [-89.6, 14.4]]
FAR_SQUARE = [[-80.0, 10.0], [-79.0, 10.0], [-79.0, 11.0], [-80.0, 11.0], [-80.0, 10.0]]


def test_chiquimula_snaps_to_its_power_cell() -> None:
    cell = snap_to_cell(14.70, -89.50)

    assert (cell.lat, cell.lon, cell.cell_id) == (14.5, -89.375, "14.5_-89.375")


def test_cell_bounds_are_half_a_step_around_the_node() -> None:
    cell = snap_to_cell(14.70, -89.50)

    assert cell.polygon.coordinates == [
        [
            [-89.6875, 14.25],
            [-89.0625, 14.25],
            [-89.0625, 14.75],
            [-89.6875, 14.75],
            [-89.6875, 14.25],
        ]
    ]


@pytest.mark.parametrize(("lat", "lon"), [(14.26, -89.68), (14.74, -89.07), (14.70, -89.50)])
def test_every_point_inside_the_cell_snaps_to_the_same_node(lat: float, lon: float) -> None:
    assert snap_to_cell(lat, lon).cell_id == "14.5_-89.375"


def test_cell_resolution_is_about_sixty_km() -> None:
    assert 55 < cell_resolution_km(14.5) < 67


def test_point_inside_a_ring() -> None:
    assert point_in_rings(14.7, -89.5, [SQUARE])


def test_point_outside_every_ring() -> None:
    assert not point_in_rings(16.0, -89.5, [SQUARE])


def test_point_in_a_hole_is_outside() -> None:
    assert not point_in_rings(14.5, -89.5, [SQUARE, HOLE])


def test_multipolygon_checks_every_part() -> None:
    assert point_in_rings(10.5, -79.5, [SQUARE, FAR_SQUARE])
