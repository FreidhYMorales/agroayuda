from pathlib import Path

import duckdb
import pytest

from api.repository import find_site
from contracts import SiteData

EXAMPLE = Path(__file__).resolve().parents[2] / "contracts" / "examples" / "site_data.json"


@pytest.fixture
def sites_parquet(tmp_path: Path) -> Path:
    """Parquet fixture built from the frozen SiteData example (no data pipeline needed)."""
    path = tmp_path / "sites.parquet"
    duckdb.execute(
        # read_json would infer data_version as a DATE; the contract says string.
        "COPY (SELECT * REPLACE (CAST(data_version AS VARCHAR) AS data_version) "
        f"FROM read_json('{EXAMPLE.as_posix()}')) TO '{path.as_posix()}' (FORMAT parquet)"
    )
    return path


def test_find_site_returns_the_cell(sites_parquet: Path) -> None:
    site = find_site(sites_parquet, "14.5_-89.375")

    assert isinstance(site, SiteData)
    assert site.lat == 14.5
    assert site.risks[0].id == "canicula"


def test_find_site_returns_none_for_unknown_cell(sites_parquet: Path) -> None:
    assert find_site(sites_parquet, "0.0_0.0") is None
