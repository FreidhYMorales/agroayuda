import json
from pathlib import Path

from contracts import SiteData
from data_pipeline.parquet_io import read_site_data, write_site_data

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"


def example_site() -> SiteData:
    return SiteData.model_validate(json.loads((EXAMPLES / "site_data.json").read_text("utf-8")))


def test_site_data_round_trips_through_parquet(tmp_path: Path) -> None:
    site = example_site()
    path = tmp_path / "sites.parquet"

    write_site_data([site], path)

    assert read_site_data(path) == [site]


def test_null_soil_survives_the_round_trip(tmp_path: Path) -> None:
    site = example_site().model_copy(
        update={
            "soil": example_site().soil.model_copy(
                update={"clay_pct": None, "sand_pct": None, "ph": None, "soc_g_kg": None}
            ),
            "soil_sample_lat": None,
            "soil_sample_lon": None,
        }
    )
    path = tmp_path / "sites.parquet"

    write_site_data([site], path)

    assert read_site_data(path)[0].soil.clay_pct is None
