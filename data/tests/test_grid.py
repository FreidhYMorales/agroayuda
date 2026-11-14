from data_pipeline.grid import (
    cell_bounds,
    cell_id,
    cell_polygon,
    cell_resolution_km,
    cells_in_bbox,
    cells_intersecting,
    snap,
)

CHIQUIMULA_CELL = (14.5, -89.375)


def test_chiquimula_snaps_to_its_cell() -> None:
    assert snap(14.70, -89.50) == (14.5, -89.375)
    assert cell_bounds(14.5, -89.375) == (-89.6875, 14.25, -89.0625, 14.75)


def test_snap_rounds_half_up_like_the_api() -> None:
    # Exactly on the edge between two cells: the API's round-half-up sends it north/east.
    assert snap(14.25, -89.6875) == (14.5, -89.375)


def test_cell_id_matches_the_api_format() -> None:
    assert cell_id(14.5, -89.375) == "14.5_-89.375"
    assert cell_id(15.0, -90.0) == "15.0_-90.0"


def test_cell_resolution_matches_the_api_formula() -> None:
    # Mean side of a 0.5 x 0.625 degree cell at 14.5 N: (55.66 + 67.36) / 2 km.
    assert cell_resolution_km(14.5) == 61.5


def test_cell_polygon_is_a_closed_counterclockwise_ring() -> None:
    polygon = cell_polygon(14.5, -89.375)

    assert polygon == {
        "type": "Polygon",
        "coordinates": [
            [
                [-89.6875, 14.25],
                [-89.0625, 14.25],
                [-89.0625, 14.75],
                [-89.6875, 14.75],
                [-89.6875, 14.25],
            ]
        ],
    }


def test_cells_in_bbox_include_every_cell_that_touches_it() -> None:
    cells = cells_in_bbox(min_lon=-89.5, min_lat=14.3, max_lon=-89.0, max_lat=14.6)

    # lon -89.5..-89.0 touches the cells centered at -89.375 and -88.75; lat 14.3..14.6 only 14.5.
    assert cells == [(14.5, -89.375), (14.5, -88.75)]


def test_cells_intersecting_a_small_region_inside_one_cell() -> None:
    ring = [[-89.5, 14.6], [-89.4, 14.6], [-89.4, 14.7], [-89.5, 14.6]]

    assert cells_intersecting([ring]) == [CHIQUIMULA_CELL]


def test_cells_intersecting_skips_bbox_cells_the_region_does_not_reach() -> None:
    # A thin diagonal triangle: its bbox covers 4 cells, the shape only 3 of them.
    ring = [[-89.6, 14.3], [-88.5, 15.1], [-89.6, 14.4], [-89.6, 14.3]]

    cells = cells_intersecting([ring])

    assert CHIQUIMULA_CELL in cells
    assert (15.0, -88.75) in cells
    assert (15.0, -89.375) not in cells  # top-left corner of the bbox: the triangle misses it


def test_cells_intersecting_counts_a_cell_fully_inside_the_region() -> None:
    big = [[-91.0, 13.0], [-88.0, 13.0], [-88.0, 16.0], [-91.0, 16.0], [-91.0, 13.0]]

    assert CHIQUIMULA_CELL in cells_intersecting([big])
