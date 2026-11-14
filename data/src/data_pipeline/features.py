"""Climate features per POWER cell from the cleaned daily frame (columns precip_mm, tmax_c).

Totals skip NaN days (cleaned -999), so one missing day does not blank a month; a month with no
data at all stays NaN, which risks.py reports as missing data.
"""

from typing import Final

import pandas as pd  # type: ignore[import-untyped]

from engine.risks import dry_spell_year_share

DECIMALS = 2

# Fixed before any cell was computed (data/README.md). Never tune these after seeing a cell.
DRY_SPELL_N_DAYS: Final = 20
DRY_DAY_MM: Final = 1.0
DRY_SPELL_RULE: Final = (
    "dry day < 1 mm (PRECTOTCORR); at least 20 consecutive dry days in Jul-Aug, 1991-2020 "
    "(adaptado de refs [7] [8]; official INSIVUMEH index pending)"
)


def is_dry_day(mm: float) -> bool:
    """Rule (a) of the region-wide check: a dry day has less than 1 mm."""
    return mm < DRY_DAY_MM


def dry_spell_share(daily: pd.DataFrame) -> float:
    """Share of the 30 years with at least DRY_SPELL_N_DAYS consecutive dry days in Jul-Aug."""
    return dry_spell_year_share(daily["precip_mm"], DRY_SPELL_N_DAYS, is_dry_day)


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
