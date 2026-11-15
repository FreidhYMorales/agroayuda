"""English versions of the option texts (i18n story 05)."""

import pytest

from contracts import Criteria, Priorities
from engine.texts import reason_line_en

CRITERIA = Criteria(water=4, soil=2, income=3, risk=5)


@pytest.mark.parametrize(
    ("priorities", "expected"),
    [
        (
            Priorities(water=5, soil=3, income=3, risk=3),
            "Your top priority is saving water: this option scores 4 of 5.",
        ),
        (
            Priorities(water=1, soil=5, income=1, risk=1),
            "Your top priority is caring for the soil: this option scores 2 of 5.",
        ),
        (
            Priorities(water=1, soil=1, income=1, risk=5),
            "Your top priority is lowering the risk: this option scores 5 of 5.",
        ),
    ],
)
def test_reason_line_in_english(priorities: Priorities, expected: str) -> None:
    assert reason_line_en(priorities, CRITERIA) == expected
