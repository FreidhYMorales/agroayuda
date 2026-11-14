"""Site risks (canícula, bare field, missing data): pure rules, no I/O. Rules: docs/spec.md.

The data pipeline runs these once per POWER cell and stores the result in SiteData.risks.
pandas is only imported for type checking: dry_spell_year_share walks the series with plain
Python, so the engine keeps no runtime dependency on pandas.
"""

from __future__ import annotations

import math
from collections.abc import Callable
from itertools import groupby
from typing import TYPE_CHECKING, Final

from contracts import CropCatalogEntry, Level, SiteData, SiteRisk
from engine.calendar import bare_months

if TYPE_CHECKING:
    import pandas as pd  # type: ignore[import-untyped]

# Canícula cut-offs on the share of years (fixed in data/README.md before any cell was computed).
LOW_BELOW: Final = 1 / 3
HIGH_ABOVE: Final = 2 / 3
CANICULA_MONTHS: Final = [7, 8]
CLIMATE_YEARS: Final = 30  # 1991-2020

CANICULA_SOURCE: Final = "NASA POWER (PRECTOTCORR diario, 1991-2020)"
CALENDAR_SOURCE: Final = "Calendario de siembra y catálogo de cultivos"
SOIL_SOURCE: Final = "SoilGrids 2.0 (ISRIC), CC BY 4.0"
REGIONAL_NOTE: Final = (
    "La lluvia de NASA POWER es una estimación regional (modelo MERRA-2), "
    "no una medición en su parcela."
)

MONTHS_ES: Final = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]
SEVERITY: Final[dict[Level, int]] = {"high": 0, "medium": 1, "low": 2, "unknown": 3}


def _longest_run(days: list[tuple[int, bool]]) -> int:
    """Longest streak of dry days; a gap in the day ordinals breaks the streak."""
    best = run = 0
    previous: int | None = None
    for ordinal, dry in days:
        contiguous = previous is not None and ordinal == previous + 1
        run = (run + 1 if contiguous else 1) if dry else 0
        best = max(best, run)
        previous = ordinal
    return best


def dry_spell_year_share(
    daily_mm: pd.Series, n_days: int, is_dry: Callable[[float], bool]
) -> float:
    """Share of years with at least n_days consecutive dry days in July-August.

    `daily_mm` is indexed by date. A NaN day is never dry, so it breaks the run.
    """
    days = sorted(
        (day.year, day.toordinal(), not math.isnan(mm) and is_dry(mm))
        for day, mm in daily_mm.items()
        if day.month in CANICULA_MONTHS
    )
    if not days:
        raise ValueError("no July-August days in the series")
    years = [
        _longest_run([(ordinal, dry) for _, ordinal, dry in group]) >= n_days
        for _, group in groupby(days, key=lambda item: item[0])
    ]
    return sum(years) / len(years)


def canicula_level(share: float) -> Level:
    """low < 1/3 of years, medium 1/3-2/3 (edges included), high > 2/3; NaN is unknown."""
    if math.isnan(share):
        return "unknown"
    if share < LOW_BELOW:
        return "low"
    if share > HIGH_ABOVE:
        return "high"
    return "medium"


def _canicula(share: float) -> SiteRisk:
    level = canicula_level(share)
    if level == "unknown":
        explanation = f"No hay datos de lluvia suficientes para julio y agosto. {REGIONAL_NOTE}"
    else:
        lead = {
            "high": "Racha seca larga (canícula) en julio y agosto en la mayoría de los años.",
            "medium": "Racha seca larga (canícula) en julio y agosto en algunos años.",
            "low": "Pocas rachas secas largas en julio y agosto.",
        }[level]
        years = round(share * CLIMATE_YEARS)
        explanation = (
            f"{lead} Hubo una racha seca larga en {years} de {CLIMATE_YEARS} años "
            f"(1991-2020). {REGIONAL_NOTE}"
        )
    threshold = {"high": round(HIGH_ABOVE, 2), "medium": round(LOW_BELOW, 2)}.get(level)
    return SiteRisk(
        id="canicula",
        level=level,
        period_months=list(CANICULA_MONTHS),
        value=None if math.isnan(share) else share,
        threshold=threshold,
        unit="share of years 1991-2020",
        source=CANICULA_SOURCE,
        estimated=False,
        explanation_es=explanation,
    )


def _bare_field(primera: CropCatalogEntry, postrera: CropCatalogEntry) -> SiteRisk:
    months = bare_months(primera, postrera)
    count = len(months)
    level: Level = "low" if count <= 3 else "medium" if count <= 5 else "high"
    rotation = f"{primera.name_es.lower()} → {postrera.name_es.lower()}"
    if months:
        span = f"de {MONTHS_ES[months[0] - 1]} a {MONTHS_ES[months[-1] - 1]}"
        if count == 1:
            span = f"en {MONTHS_ES[months[0] - 1]}"
        text = f"Suelo sin cultivo {span} (estimado, con la rotación típica {rotation})."
    else:
        text = f"El suelo queda cubierto todo el año (estimado, con la rotación típica {rotation})."
    return SiteRisk(
        id="bare_field",
        level=level,
        period_months=months,
        value=float(count),
        threshold=None,
        unit="meses",
        source=CALENDAR_SOURCE,
        estimated=True,
        explanation_es=text,
    )


def _missing_data(site: SiteData) -> SiteRisk | None:
    soil = site.soil
    soil_gap = None in (soil.clay_pct, soil.sand_pct, soil.ph, soil.soc_g_kg)
    series = [
        *site.monthly_precip_mm,
        *site.monthly_tmax_c,
        *site.dekadal_precip_mm,
        site.dry_spell_year_share,
    ]
    climate_gap = any(math.isnan(value) for value in series)
    if not (soil_gap or climate_gap):
        return None
    sources = [CANICULA_SOURCE] * climate_gap + [SOIL_SOURCE] * soil_gap
    parts = ["datos de clima"] * climate_gap + ["datos de suelo"] * soil_gap
    return SiteRisk(
        id="missing_data",
        level="unknown",
        period_months=[],
        value=None,
        threshold=None,
        unit="",
        source="; ".join(sources),
        estimated=False,
        explanation_es=f"Faltan {' y '.join(parts)} para esta zona.",
    )


def site_risks(
    site: SiteData, typical_primera: CropCatalogEntry, typical_postrera: CropCatalogEntry
) -> list[SiteRisk]:
    """Every site risk, sorted high, medium, low, then unknown (stable within a level)."""
    risks = [_canicula(site.dry_spell_year_share), _bare_field(typical_primera, typical_postrera)]
    missing = _missing_data(site)
    if missing is not None:
        risks.append(missing)
    return sorted(risks, key=lambda risk: SEVERITY[risk.level])
