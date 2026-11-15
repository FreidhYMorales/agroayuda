import json
import math
from pathlib import Path

import pandas as pd  # type: ignore[import-untyped]
import pytest

from contracts import CropCatalogEntry, SiteData
from engine.risks import canicula_level, dry_spell_year_share, site_risks

EXAMPLES = Path(__file__).resolve().parents[2] / "contracts" / "examples"
N_DAYS = 20
YEARS = range(1991, 2021)


def is_dry(mm: float) -> bool:
    return mm < 1.0


def crop(crop_id: str) -> CropCatalogEntry:
    entries = json.loads((EXAMPLES / "crop_catalog.json").read_text("utf-8"))
    return next(CropCatalogEntry.model_validate(e) for e in entries if e["id"] == crop_id)


def site(**update: object) -> SiteData:
    base = SiteData.model_validate_json((EXAMPLES / "site_data.json").read_text("utf-8"))
    return base.model_copy(update={"risks": [], **update})


def jul_aug(dry_runs: dict[int, int], rain_mm: float = 5.0) -> pd.Series:
    """Jul-Aug daily rain for 1991-2020; dry_runs maps year -> length of one dry run from Jul 10."""
    values: dict[pd.Timestamp, float] = {}
    for year in YEARS:
        days = pd.date_range(f"{year}-07-01", f"{year}-08-31", freq="D")
        start = pd.Timestamp(f"{year}-07-10")
        run = dry_runs.get(year, 0)
        for day in days:
            values[day] = 0.2 if start <= day < start + pd.Timedelta(days=run) else rain_mm
    return pd.Series(values, dtype="float64")


# --- dry_spell_year_share ------------------------------------------------------------------------


def test_share_counts_years_with_a_long_enough_run() -> None:
    series = jul_aug({1991: 20, 1992: 19, 1993: 30})

    assert dry_spell_year_share(series, N_DAYS, is_dry) == pytest.approx(2 / 30)


def test_share_ignores_dry_days_outside_july_august() -> None:
    june = pd.Series(0.0, index=pd.date_range("1991-06-01", "1991-06-30", freq="D"))
    series = pd.concat([june, jul_aug({})])

    assert dry_spell_year_share(series, N_DAYS, is_dry) == 0.0


def test_a_missing_day_breaks_the_run() -> None:
    series = jul_aug({1991: 25})
    series[pd.Timestamp("1991-07-20")] = math.nan

    assert dry_spell_year_share(series, N_DAYS, is_dry) == 0.0


def test_fewer_and_shorter_dry_spells_give_a_lower_share_and_level() -> None:
    # A long canícula in 25 of 30 years vs. a just-long-enough one in 5 years, short otherwise.
    frequent = jul_aug({year: 25 for year in YEARS[:25]})
    rare = jul_aug({year: (21 if year in YEARS[:5] else 6) for year in YEARS})

    frequent_share = dry_spell_year_share(frequent, N_DAYS, is_dry)
    rare_share = dry_spell_year_share(rare, N_DAYS, is_dry)

    assert rare_share < frequent_share
    assert canicula_level(frequent_share) == "high"
    assert canicula_level(rare_share) == "low"


# --- canicula_level ------------------------------------------------------------------------------


def test_cut_offs() -> None:
    assert canicula_level(0.2) == "low"
    assert canicula_level(0.5) == "medium"
    assert canicula_level(0.8) == "high"


def test_nan_share_is_unknown_not_medium() -> None:
    assert canicula_level(math.nan) == "unknown"


def test_cut_off_edges_belong_to_medium() -> None:
    assert canicula_level(10 / 30) == "medium"
    assert canicula_level(20 / 30) == "medium"
    assert canicula_level(21 / 30) == "high"


# --- site_risks ----------------------------------------------------------------------------------


def test_canicula_risk_fields() -> None:
    risks = site_risks(site(dry_spell_year_share=0.7), crop("maiz"), crop("frijol"))

    canicula = next(r for r in risks if r.id == "canicula")
    assert canicula.level == "high"
    assert canicula.period_months == [7, 8]
    assert canicula.value == 0.7
    assert canicula.threshold == 0.67
    assert canicula.unit == "share of years 1991-2020"
    assert canicula.estimated is False
    assert "NASA POWER" in canicula.source
    assert "julio y agosto" in canicula.explanation_es
    assert "estimación regional" in canicula.explanation_es


def test_low_canicula_has_no_threshold() -> None:
    risks = site_risks(site(dry_spell_year_share=1 / 30), crop("maiz"), crop("frijol"))

    canicula = next(r for r in risks if r.id == "canicula")
    assert canicula.level == "low"
    assert canicula.threshold is None
    assert "1 de 30 años" in canicula.explanation_es


def test_bare_field_with_the_typical_rotation() -> None:
    risks = site_risks(site(), crop("maiz"), crop("frijol"))

    bare = next(r for r in risks if r.id == "bare_field")
    assert bare.level == "medium"
    assert bare.period_months == [12, 1, 2, 3, 4]
    assert bare.value == 5.0
    assert bare.threshold is None
    assert bare.unit == "meses"
    assert bare.estimated is True
    assert bare.explanation_es == (
        "Suelo sin cultivo de diciembre a abril (estimado, con la rotación típica maíz → frijol)."
    )


def test_missing_soil_adds_an_unknown_risk_last() -> None:
    soil = site().soil.model_copy(update={"ph": None})

    risks = site_risks(site(soil=soil), crop("maiz"), crop("frijol"))

    assert risks[-1].id == "missing_data"
    assert risks[-1].level == "unknown"
    assert risks[-1].value is None
    assert risks[-1].threshold is None
    assert risks[-1].unit == ""
    assert "SoilGrids" in risks[-1].source


def test_nan_climate_adds_missing_data() -> None:
    precip = [*site().monthly_precip_mm[:6], math.nan, *site().monthly_precip_mm[7:]]

    risks = site_risks(site(monthly_precip_mm=precip), crop("maiz"), crop("frijol"))

    assert [r.id for r in risks][-1] == "missing_data"
    assert "NASA POWER" in risks[-1].source


def test_complete_data_has_no_missing_data_risk() -> None:
    risks = site_risks(site(), crop("maiz"), crop("frijol"))

    assert "missing_data" not in [r.id for r in risks]


def test_order_is_high_medium_low_then_unknown() -> None:
    soil = site().soil.model_copy(update={"ph": None})

    risks = site_risks(site(dry_spell_year_share=0.8, soil=soil), crop("maiz"), crop("frijol"))

    assert [r.id for r in risks] == ["canicula", "bare_field", "missing_data"]


def test_low_canicula_sorts_after_a_medium_bare_field() -> None:
    risks = site_risks(site(dry_spell_year_share=0.1), crop("maiz"), crop("frijol"))

    assert [r.id for r in risks] == ["bare_field", "canicula"]
