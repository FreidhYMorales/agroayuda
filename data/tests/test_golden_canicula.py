"""Golden cell: Chiquimula (14.70, -89.50) -> POWER cell 14.5_-89.375 (see data/README.md).

The fixture is the cell's real Jul-Aug PRECTOTCORR, 1991-2020, as downloaded from POWER. The
expected values are the documented rule (N = 20, dry day < 1 mm, cut-offs 1/3 and 2/3) applied
to that data, recorded in data/README.md: only 1994 (25 days) of the 30 years reaches 20 days.
"""

from pathlib import Path

import pandas as pd  # type: ignore[import-untyped]
import pytest

from data_pipeline.features import dry_spell_share
from data_pipeline.grid import cell_id, snap
from engine.risks import canicula_level

FIXTURE = Path(__file__).parent / "fixtures" / "power_jul_aug_14.5_-89.375.csv"


def golden_daily() -> pd.DataFrame:
    return pd.read_csv(FIXTURE, index_col="date", parse_dates=["date"])


def test_golden_point_snaps_to_the_documented_cell() -> None:
    assert cell_id(*snap(14.70, -89.50)) == "14.5_-89.375"


def test_fixture_covers_every_july_august_day_of_1991_2020() -> None:
    daily = golden_daily()

    assert len(daily) == 30 * 62
    assert daily["precip_mm"].notna().all()


def test_golden_canicula_follows_the_documented_rule() -> None:
    share = dry_spell_share(golden_daily())

    assert share == pytest.approx(1 / 30)
    assert canicula_level(share) == "low"
