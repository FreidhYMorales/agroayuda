"""Scoring v1 (docs/spec.md): per-crop criteria, season combination, rounding."""

import math

from contracts import Confidence, CropCatalogEntry, Level, Priorities, SiteProfile, Tier
from engine.calendar import bare_months

TIER_NUMBER: dict[Tier, int] = {"low": 1, "medium": 2, "high": 3}
# Fallow saves water but leaves the soil bare and earns nothing.
NONE_ROW = {"water": 5.0, "soil": 1.0, "income": 1.0, "risk": 5.0}


CANICULA_PENALTY: dict[Level, float] = {"high": 1.0, "medium": 0.5}
# Soil loses 0.5 when an option leaves this many months bare, or more.
BARE_MONTHS_LIMIT = 6


def canicula_level(site: SiteProfile) -> Level:
    """The site's canícula level; "unknown" when the site has no canícula risk."""
    return next((risk.level for risk in site.risks if risk.id == "canicula"), "unknown")


def failure_reason(site: SiteProfile, primera: CropCatalogEntry, irrigation: bool) -> str | None:
    """F1/F2: why the primera crop is likely lost in a high canícula, or None."""
    if irrigation or canicula_level(site) != "high":
        return None
    if primera.water_need == "high":
        return "Necesita mucha agua justo en la canícula"
    if primera.drought_tolerance == "low":
        return "Aguanta poco la sequía de la canícula"
    return None


def confidence(site: SiteProfile, crops: list[CropCatalogEntry]) -> Confidence:
    """Factors: 1 if any soil field is null, plus 1 per non-`none` crop without a local source."""
    soil = site.soil
    missing_soil = None in (soil.clay_pct, soil.sand_pct, soil.ph, soil.soc_g_kg)
    non_local = sum(1 for crop in crops if crop.id != "none" and not crop.local_source)
    factors = int(missing_soil) + non_local
    return "high" if factors == 0 else "medium" if factors == 1 else "low"


def round_half_up(x: float) -> int:
    """Round .5 up (Python's round() rounds half to even, so 2.5 would become 2)."""
    return math.floor(x + 0.5)


def _tier_to_score(tier: Tier) -> float:
    """low 1, medium 3, high 5."""
    return 2.0 * TIER_NUMBER[tier] - 1.0


def crop_criteria(crop: CropCatalogEntry) -> dict[str, float]:
    if crop.id == "none":
        return dict(NONE_ROW)
    return {
        "water": 7.0 - 2.0 * TIER_NUMBER[crop.water_need],
        "soil": 1.0 + 2.0 * crop.n_fixing + (TIER_NUMBER[crop.erosion_cover] - 1),
        "income": _tier_to_score(crop.market_tier),
        "risk": _tier_to_score(crop.drought_tolerance),
    }


def weighted_score(criteria: dict[str, float], priorities: Priorities) -> float:
    """sum(priority x criterion) / sum(priority), on the clamped float criteria."""
    weights: dict[str, int] = {
        "water": priorities.water,
        "soil": priorities.soil,
        "income": priorities.income,
        "risk": priorities.risk,
    }
    return sum(weights[name] * value for name, value in criteria.items()) / sum(weights.values())


def _clamp(x: float) -> float:
    return min(5.0, max(1.0, x))


def score_option(
    site: SiteProfile, primera: CropCatalogEntry, postrera: CropCatalogEntry, irrigation: bool
) -> dict[str, float]:
    """Clamped float criteria: mean of both seasons for water, soil, income; min for risk."""
    first, second = crop_criteria(primera), crop_criteria(postrera)
    # The canícula falls in the primera cycle; fallow has nothing to lose.
    if primera.id != "none":
        first["risk"] -= CANICULA_PENALTY.get(canicula_level(site), 0.0)
    if irrigation:
        for crop, criteria in ((primera, first), (postrera, second)):
            if crop.water_need == "high":
                criteria["risk"] += 1.0
    combined = {name: (first[name] + second[name]) / 2 for name in ("water", "soil", "income")}
    combined["risk"] = min(first["risk"], second["risk"])
    if len(bare_months(primera, postrera)) >= BARE_MONTHS_LIMIT:
        combined["soil"] -= 0.5
    return {name: _clamp(value) for name, value in combined.items()}
