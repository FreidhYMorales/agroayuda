"""Scoring v1 (docs/spec.md): per-crop criteria, season combination, rounding."""

import math


def round_half_up(x: float) -> int:
    """Round .5 up (Python's round() rounds half to even, so 2.5 would become 2)."""
    return math.floor(x + 0.5)
