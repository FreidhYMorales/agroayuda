"""Climate features per POWER cell from the cleaned daily frame (columns precip_mm, tmax_c).

Totals skip NaN days (cleaned -999), so one missing day does not blank a month; a month with no
data at all stays NaN, which risks.py reports as missing data.
"""

import pandas as pd  # type: ignore[import-untyped]

DECIMALS = 2


def _rounded(values: pd.Series) -> list[float]:
    return [round(float(value), DECIMALS) for value in values]


def monthly_precip_mm(daily: pd.DataFrame) -> list[float]:
    """12 values: mean over years of each month's total rain (mm)."""
    precip = daily["precip_mm"]
    totals = precip.groupby([precip.index.year, precip.index.month]).sum(min_count=1)
    by_month = totals.groupby(level=1).mean()
    return _rounded(by_month.reindex(range(1, 13)))


def monthly_tmax_c(daily: pd.DataFrame) -> list[float]:
    """12 values: mean daily maximum temperature per month (degC)."""
    tmax = daily["tmax_c"]
    return _rounded(tmax.groupby(tmax.index.month).mean().reindex(range(1, 13)))


def dekad_index(day: pd.Timestamp) -> int:
    """0-35: days 1-10, 11-20 and 21-end of each month."""
    return int((day.month - 1) * 3 + min((day.day - 1) // 10, 2))


def dekadal_precip_mm(daily: pd.DataFrame) -> list[float]:
    """36 values: mean over years of each dekad's total rain (mm)."""
    precip = daily["precip_mm"]
    dekads = [dekad_index(day) for day in precip.index]
    totals = precip.groupby([precip.index.year, dekads]).sum(min_count=1)
    by_dekad = totals.groupby(level=1).mean()
    return _rounded(by_dekad.reindex(range(36)))
