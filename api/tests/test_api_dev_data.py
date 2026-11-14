from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from api import main
from api.dev_data import DEV_DATA_VERSION, build_dev_data
from api.main import app, get_data_dir, resolve_data_dir
from contracts import SiteProfile


def test_dev_data_serves_the_chiquimula_cell(tmp_path: Path) -> None:
    build_dev_data(tmp_path)
    app.dependency_overrides[get_data_dir] = lambda: tmp_path
    try:
        client = TestClient(app)
        health = client.get("/health").json()
        site = client.get("/site", params={"lat": 14.70, "lon": -89.50})
        outside = client.get("/site", params={"lat": 16.0, "lon": -89.50})
    finally:
        app.dependency_overrides.clear()

    assert health["data_version"] == DEV_DATA_VERSION
    assert SiteProfile.model_validate(site.json()).location.lat == 14.70
    assert outside.json()["error"] == "outside_region"


def test_real_data_wins_over_dev_data(tmp_path: Path) -> None:
    real, dev = tmp_path / "real", tmp_path / "dev"
    real.mkdir()
    (real / "sites.parquet").write_bytes(b"x")

    assert resolve_data_dir(real, dev) == real


def test_dev_data_is_used_until_the_pipeline_runs(tmp_path: Path) -> None:
    real, dev = tmp_path / "real", tmp_path / "dev"

    assert resolve_data_dir(real, dev) == dev


def test_env_var_overrides_both(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("AGROAYUDA_DATA_DIR", str(tmp_path))

    assert main.get_data_dir() == tmp_path


def test_committed_dev_data_exists() -> None:
    assert (main.DEV_DATA_DIR / "sites.parquet").exists()
    assert (main.DEV_DATA_DIR / "region.parquet").exists()
