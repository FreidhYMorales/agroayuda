import json
from pathlib import Path

import httpx

from data_pipeline.soilgrids import (
    SOIL_DEPTH,
    fetch_soil,
    parse_soilgrids,
    scale_soilgrids,
    soil_cache_path,
)

FIXTURES = Path(__file__).parent / "fixtures"
CHIQUIMULA = FIXTURES / "soilgrids_14.5_-89.375.json"
OCEAN = FIXTURES / "soilgrids_13.0_-91.25.json"


def load(path: Path) -> dict[str, object]:
    payload: dict[str, object] = json.loads(path.read_text("utf-8"))
    return payload


def test_scaling_divides_every_property_by_ten() -> None:
    raw: dict[str, int | None] = {"soc": 120, "phh2o": 65, "clay": 300, "sand": 400}

    assert scale_soilgrids(raw) == {
        "soc_g_kg": 12.0,
        "ph": 6.5,
        "clay_pct": 30.0,
        "sand_pct": 40.0,
    }


def test_recorded_response_scales_into_plausible_ranges() -> None:
    soil = scale_soilgrids(parse_soilgrids(load(CHIQUIMULA)))

    clay, sand, ph, soc = soil["clay_pct"], soil["sand_pct"], soil["ph"], soil["soc_g_kg"]
    assert clay is not None and 0 <= clay <= 100
    assert sand is not None and 0 <= sand <= 100
    assert ph is not None and 3 <= ph <= 10
    assert soc is not None and soc >= 0


def test_recorded_response_uses_the_documented_depth() -> None:
    payload = load(CHIQUIMULA)
    properties = payload["properties"]
    assert isinstance(properties, dict)

    labels = {layer["depths"][0]["label"] for layer in properties["layers"]}

    assert labels == {SOIL_DEPTH}


def test_null_response_gives_null_soil_without_error() -> None:
    soil = scale_soilgrids(parse_soilgrids(load(OCEAN)))

    assert soil == {"soc_g_kg": None, "ph": None, "clay_pct": None, "sand_pct": None}


def test_fetch_soil_reads_the_cache_without_network(tmp_path: Path) -> None:
    soil_cache_path(14.5, -89.375, tmp_path).write_bytes(CHIQUIMULA.read_bytes())

    def no_network(request: httpx.Request) -> httpx.Response:
        raise AssertionError(f"unexpected request {request.url}")

    with httpx.Client(transport=httpx.MockTransport(no_network)) as client:
        soil = fetch_soil(14.5, -89.375, tmp_path, client=client)

    assert soil["clay_pct"] == 34.4


def test_fetch_soil_asks_for_the_four_properties_at_one_depth(tmp_path: Path) -> None:
    seen: list[httpx.URL] = []

    def answer(request: httpx.Request) -> httpx.Response:
        seen.append(request.url)
        return httpx.Response(200, content=CHIQUIMULA.read_bytes())

    with httpx.Client(transport=httpx.MockTransport(answer)) as client:
        fetch_soil(14.5, -89.375, tmp_path, client=client, sleep=lambda _: None)

    params = seen[0].params
    assert sorted(params.get_list("property")) == ["clay", "phh2o", "sand", "soc"]
    assert params.get_list("depth") == [SOIL_DEPTH]
    assert params["value"] == "mean"
    assert params["lat"] == "14.5"
    assert params["lon"] == "-89.375"
