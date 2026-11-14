import json
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import duckdb
import pytest
from fastapi.testclient import TestClient

from api.main import app, get_data_dir
from contracts import ErrorResponse, RecommendationResponse, SiteProfile

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"
# Region around the Chiquimula cell, plus a strip to the west whose cell has no data row.
REGION_RINGS = [
    [[-90.0, 14.0], [-89.0, 14.0], [-89.0, 15.0], [-90.0, 15.0], [-90.0, 14.0]],
    [[-91.0, 14.0], [-90.5, 14.0], [-90.5, 15.0], [-91.0, 15.0], [-91.0, 14.0]],
]
CHIQUIMULA = {"lat": 14.70, "lon": -89.50}
OUTSIDE = {"lat": 14.63, "lon": -90.2}
NO_DATA_CELL = {"lat": 14.70, "lon": -90.8}


@pytest.fixture
def data_dir(tmp_path: Path) -> Path:
    """Parquet fixtures built from the frozen examples (stand-in for the data pipeline)."""
    con = duckdb.connect()
    site_example = (EXAMPLES / "site_data.json").as_posix()
    con.execute(
        "COPY (SELECT * REPLACE (CAST(data_version AS VARCHAR) AS data_version) "
        f"FROM read_json('{site_example}')) TO '{(tmp_path / 'sites.parquet').as_posix()}' "
        "(FORMAT parquet)"
    )
    con.execute("CREATE TABLE region (ring DOUBLE[][])")
    con.executemany("INSERT INTO region VALUES (?)", [[ring] for ring in REGION_RINGS])
    con.execute(f"COPY region TO '{(tmp_path / 'region.parquet').as_posix()}' (FORMAT parquet)")
    con.close()
    return tmp_path


@pytest.fixture
def client(data_dir: Path) -> Iterator[TestClient]:
    app.dependency_overrides[get_data_dir] = lambda: data_dir
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


def request_body(location: dict[str, float], primera: str = "maiz") -> dict[str, object]:
    return {
        "location": location,
        "current_rotation": {"primera": primera, "postrera": "frijol"},
        "priorities": {"water": 5, "soil": 3, "income": 3, "risk": 3},
        "constraints": {"irrigation": False},
    }


def assert_error(response: Any, status: int, code: str) -> None:
    assert response.status_code == status
    assert ErrorResponse.model_validate(response.json()).error == code


def test_health_reports_the_data_version(client: TestClient) -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "data_version": "2026-11-14"}


def test_site_returns_the_profile_of_the_tapped_cell(client: TestClient) -> None:
    response = client.get("/site", params=CHIQUIMULA)

    assert response.status_code == 200
    site = SiteProfile.model_validate(response.json())
    assert site.location.lat == 14.70
    assert site.cell_polygon.coordinates[0][0] == [-89.6875, 14.25]
    assert site.soil_sample_location is not None
    assert [risk.id for risk in site.risks] == ["canicula", "bare_field"]


def test_site_outside_the_region(client: TestClient) -> None:
    assert_error(client.get("/site", params=OUTSIDE), 404, "outside_region")


def test_site_inside_the_region_without_a_data_row(client: TestClient) -> None:
    assert_error(client.get("/site", params=NO_DATA_CELL), 404, "not_found")


@pytest.mark.parametrize("params", [{"lat": 14.7}, {"lat": "abc", "lon": -89.5}])
def test_site_with_bad_query_is_invalid_request(
    client: TestClient, params: dict[str, object]
) -> None:
    assert_error(client.get("/site", params=params), 422, "invalid_request")


def test_recommendations_return_three_options(client: TestClient) -> None:
    response = client.post("/recommendations", json=request_body(CHIQUIMULA))

    assert response.status_code == 200
    body = RecommendationResponse.model_validate(response.json())
    assert len(body.options) == 3
    assert body.site.location.lat == 14.70


def test_recommendations_outside_the_region(client: TestClient) -> None:
    assert_error(client.post("/recommendations", json=request_body(OUTSIDE)), 404, "outside_region")


def test_recommendations_with_unknown_crop_is_invalid_request(client: TestClient) -> None:
    body = request_body(CHIQUIMULA, primera="trigo")

    assert_error(client.post("/recommendations", json=body), 422, "invalid_request")


def test_unknown_route_is_not_found(client: TestClient) -> None:
    assert_error(client.get("/nope"), 404, "not_found")


def test_unexpected_error_is_internal(client: TestClient, data_dir: Path) -> None:
    (data_dir / "sites.parquet").write_text("not parquet")

    assert_error(client.get("/site", params=CHIQUIMULA), 500, "internal")


@pytest.mark.parametrize(
    ("origin", "allowed"),
    [
        ("https://agroayuda.vercel.app", True),
        ("https://agroayuda-git-map-rain-layer.vercel.app", True),
        ("http://localhost:5173", True),
        ("https://evil.example.com", False),
    ],
)
def test_cors_allows_vercel_and_localhost_only(
    client: TestClient, origin: str, allowed: bool
) -> None:
    response = client.options(
        "/site", headers={"Origin": origin, "Access-Control-Request-Method": "GET"}
    )

    assert (response.headers.get("access-control-allow-origin") == origin) is allowed


def test_error_fixtures_match_the_api_shape() -> None:
    for path in EXAMPLES.glob("error_response_*.json"):
        ErrorResponse.model_validate(json.loads(path.read_text("utf-8")))
