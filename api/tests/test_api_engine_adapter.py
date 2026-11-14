"""The API switches from the stub to engine.recommend as soon as the engine package provides it."""

import sys
from collections.abc import Iterator
from pathlib import Path
from types import ModuleType
from typing import Any

import pytest
from fastapi.testclient import TestClient

from api import engine_stub
from api.dev_data import build_data_dir
from api.main import app, get_data_dir
from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RecommendationResponse,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)

RINGS = [[[-90.0, 14.0], [-89.0, 14.0], [-89.0, 15.0], [-90.0, 15.0], [-90.0, 14.0]]]
BODY = {
    "location": {"lat": 14.70, "lon": -89.50},
    "current_rotation": {"primera": "maiz", "postrera": "frijol"},
    "priorities": {"water": 5, "soil": 3, "income": 3, "risk": 3},
    "constraints": {"irrigation": False},
}


class FakeInvalidRequestError(ValueError):
    pass


@pytest.fixture
def client(tmp_path: Path) -> Iterator[TestClient]:
    build_data_dir(tmp_path, RINGS)
    app.dependency_overrides[get_data_dir] = lambda: tmp_path
    yield TestClient(app, raise_server_exceptions=False)
    app.dependency_overrides.clear()


@pytest.fixture
def fake_engine(monkeypatch: pytest.MonkeyPatch) -> dict[str, Any]:
    """Pretend package 02 has landed engine.recommend and engine.errors."""
    calls: dict[str, Any] = {}

    def recommend(
        site: SiteProfile,
        request: RecommendationRequest,
        crops: list[CropCatalogEntry],
        templates: list[RotationTemplate],
    ) -> list[RotationOption]:
        if request.current_rotation.primera == "maicillo":
            raise FakeInvalidRequestError("maicillo is not a primera crop")
        calls.update(crops=crops, templates=templates)
        return engine_stub.recommend(site, request)

    recommend_module = ModuleType("engine.recommend")
    recommend_module.recommend = recommend  # type: ignore[attr-defined]
    errors_module = ModuleType("engine.errors")
    errors_module.InvalidRequestError = FakeInvalidRequestError  # type: ignore[attr-defined]
    monkeypatch.setitem(sys.modules, "engine.recommend", recommend_module)
    monkeypatch.setitem(sys.modules, "engine.errors", errors_module)
    return calls


def test_health_says_real_with_the_engine_installed(client: TestClient) -> None:
    assert client.get("/health").json()["engine"] == "real"


def test_health_says_real_once_the_engine_lands(client: TestClient, fake_engine: Any) -> None:
    assert client.get("/health").json()["engine"] == "real"


def test_real_engine_gets_crops_and_templates_in_file_order(
    client: TestClient, fake_engine: dict[str, Any]
) -> None:
    response = client.post("/recommendations", json=BODY)

    assert response.status_code == 200
    assert len(RecommendationResponse.model_validate(response.json()).options) == 3
    # The dev fixture serves the real data/catalog/crops.csv, in file order.
    assert [crop.id for crop in fake_engine["crops"]] == [
        "maiz",
        "frijol",
        "maiz_frijol",
        "maicillo",
        "gandul",
        "mucuna",
        "canavalia",
        "ajonjoli",
        "ayote",
        "none",
    ]
    assert [t.id for t in fake_engine["templates"]] == [
        "maiz_frijol__maicillo",
        "frijol__maicillo",
        "maiz__frijol",
    ]


def test_engine_invalid_request_becomes_422(client: TestClient, fake_engine: Any) -> None:
    body = BODY | {"current_rotation": {"primera": "maicillo", "postrera": "frijol"}}

    response = client.post("/recommendations", json=body)

    assert response.status_code == 422
    assert response.json() == {
        "error": "invalid_request",
        "detail": "maicillo is not a primera crop",
    }
