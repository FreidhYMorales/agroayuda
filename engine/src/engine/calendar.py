"""Season calendar (team research guide, sec. 2): planting months and bare months."""

import math

from contracts import CropCatalogEntry

PRIMERA_PLANTING_MONTH = 5  # May
POSTRERA_PLANTING_MONTH = 9  # September

# Bare months are listed as the dry season runs: December first, then January onward.
CALENDAR_ORDER = [12, *range(1, 12)]


def covered_months(crop: CropCatalogEntry, planting_month: int) -> set[int]:
    """Months a crop covers: ceil(cycle_days / 30) from planting, wrapping past December."""
    if crop.id == "none":
        return set()
    span = math.ceil(crop.cycle_days / 30)
    return {(planting_month - 1 + offset) % 12 + 1 for offset in range(span)}


def bare_months(primera: CropCatalogEntry, postrera: CropCatalogEntry) -> list[int]:
    covered = covered_months(primera, PRIMERA_PLANTING_MONTH) | covered_months(
        postrera, POSTRERA_PLANTING_MONTH
    )
    return [month for month in CALENDAR_ORDER if month not in covered]
