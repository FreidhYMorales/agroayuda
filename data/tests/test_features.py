import math

import pandas as pd  # type: ignore[import-untyped]
import pytest

from data_pipeline.features import dekad_index, dekadal_precip_mm, monthly_precip_mm, monthly_tmax_c


def daily(
    precip: float = 1.0, tmax: float = 30.0, years: tuple[int, ...] = (2001, 2002)
) -> pd.DataFrame:
    index = pd.date_range(f"{years[0]}-01-01", f"{years[-1]}-12-31", freq="D", name="date")
    return pd.DataFrame({"precip_mm": precip, "tmax_c": tmax}, index=index)


def test_monthly_precip_is_the_mean_monthly_total_over_years() -> None:
    frame = daily(precip=1.0)  # 1 mm every day: each month total = its number of days
    frame.loc["2002-01", "precip_mm"] = 3.0  # Jan 2001 = 31 mm, Jan 2002 = 93 mm

    result = monthly_precip_mm(frame)

    assert len(result) == 12
    assert result[0] == pytest.approx((31 + 93) / 2)
    assert result[1] == pytest.approx(28.0)  # 2001 and 2002 are not leap years
    assert result[6] == pytest.approx(31.0)


def test_monthly_precip_ignores_a_cleaned_fill_value() -> None:
    frame = daily(precip=1.0)
    frame.loc["2001-03-05", "precip_mm"] = math.nan

    result = monthly_precip_mm(frame)

    assert result[2] == pytest.approx((30 + 31) / 2)


def test_monthly_tmax_is_the_mean_daily_max_per_month() -> None:
    frame = daily(tmax=30.0)
    frame.loc["2001-04", "tmax_c"] = 34.0

    result = monthly_tmax_c(frame)

    assert result[3] == pytest.approx(32.0)
    assert result[0] == pytest.approx(30.0)


def test_dekads_split_each_month_at_days_10_and_20() -> None:
    assert dekad_index(pd.Timestamp("2001-01-01")) == 0
    assert dekad_index(pd.Timestamp("2001-01-10")) == 0
    assert dekad_index(pd.Timestamp("2001-01-11")) == 1
    assert dekad_index(pd.Timestamp("2001-01-21")) == 2
    assert dekad_index(pd.Timestamp("2001-01-31")) == 2
    assert dekad_index(pd.Timestamp("2001-12-31")) == 35


def test_dekadal_precip_is_the_mean_dekad_total_over_years() -> None:
    result = dekadal_precip_mm(daily(precip=1.0))

    assert len(result) == 36
    assert result[0] == pytest.approx(10.0)
    assert result[2] == pytest.approx(11.0)  # Jan 21-31
    assert result[5] == pytest.approx(8.0)  # Feb 21-28
    assert sum(result) == pytest.approx(365.0)
