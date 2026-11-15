"""English versions of the option texts (i18n story 05)."""

import pytest

from contracts import Criteria, CropCatalogEntry, DeltaVsCurrent, Level, Priorities, SiteProfile
from engine.scoring import failure_reason_en
from engine.texts import benefits_en, data_gaps_en, reason_line_en

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


@pytest.mark.parametrize(
    ("deltas", "expected"),
    [
        (
            DeltaVsCurrent(water="better", soil="better", income="same", risk="worse"),
            ["Better than your rotation in: water and soil."],
        ),
        (
            DeltaVsCurrent(water="better", soil="worse", income="better", risk="better"),
            ["Better than your rotation in: water, income and risk."],
        ),
        (DeltaVsCurrent(water="same", soil="worse", income="same", risk="same"), []),
    ],
)
def test_benefits_in_english(deltas: DeltaVsCurrent, expected: list[str]) -> None:
    assert benefits_en(deltas) == expected


POWER_GAP_EN = "NASA POWER rain is a regional estimate."


def test_data_gaps_in_english_with_full_soil_and_local_crops(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    assert data_gaps_en(site, [crops["maiz"], crops["frijol"]]) == [POWER_GAP_EN]


def test_data_gaps_in_english_name_missing_soil_and_general_crops(
    site_null_soil: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # ayote has no local source in crops.csv; frijol does.
    assert data_gaps_en(site_null_soil, [crops["ayote"], crops["frijol"]]) == [
        "There is no soil data for this point.",
        "Squash: general value, check locally.",
        POWER_GAP_EN,
    ]


def with_canicula(site: SiteProfile, level: Level) -> SiteProfile:
    risks = [r.model_copy(update={"level": level}) if r.id == "canicula" else r for r in site.risks]
    return site.model_copy(update={"risks": risks})


def test_thirsty_crop_reason_in_english(site: SiteProfile, maiz: CropCatalogEntry) -> None:
    thirsty = maiz.model_copy(update={"water_need": "high", "drought_tolerance": "medium"})

    assert (
        failure_reason_en(with_canicula(site, "high"), thirsty, irrigation=False)
        == "Needs a lot of water right in the canícula"
    )


def test_drought_sensitive_crop_reason_in_english(
    site: SiteProfile, maiz: CropCatalogEntry
) -> None:
    # maíz in crops.csv: water medium, drought tolerance low.
    assert (
        failure_reason_en(with_canicula(site, "high"), maiz, irrigation=False)
        == "Cannot take much drought in the canícula"
    )


def test_no_english_reason_without_a_high_canicula(
    site: SiteProfile, maiz: CropCatalogEntry
) -> None:
    assert failure_reason_en(with_canicula(site, "medium"), maiz, irrigation=False) is None
    assert failure_reason_en(with_canicula(site, "high"), maiz, irrigation=True) is None
