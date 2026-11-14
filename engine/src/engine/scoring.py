"""Scoring v1 (docs/spec.md): per-crop criteria, season combination, rounding."""

import math

from contracts import CropCatalogEntry, SiteProfile, Tier

TIER_NUMBER: dict[Tier, int] = {"low": 1, "medium": 2, "high": 3}
# Fallow saves water but leaves the soil bare and earns nothing.
NONE_ROW = {"water": 5.0, "soil": 1.0, "income": 1.0, "risk": 5.0}


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


def _clamp(x: float) -> float:
    return min(5.0, max(1.0, x))


def score_option(
    site: SiteProfile, primera: CropCatalogEntry, postrera: CropCatalogEntry, irrigation: bool
) -> dict[str, float]:
    """Clamped float criteria: mean of both seasons for water, soil, income; min for risk."""
    first, second = crop_criteria(primera), crop_criteria(postrera)
    combined = {name: (first[name] + second[name]) / 2 for name in ("water", "soil", "income")}
    combined["risk"] = min(first["risk"], second["risk"])
    return {name: _clamp(value) for name, value in combined.items()}
