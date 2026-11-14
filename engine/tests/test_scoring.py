import pytest

from contracts import CropCatalogEntry, Priorities, SiteProfile, Tier
from engine.scoring import round_half_up, score_option, weighted_score


def illustrative_crop(
    water_need: Tier, n_fixing: bool, erosion_cover: Tier, drought: Tier, market: Tier
) -> CropCatalogEntry:
    return CropCatalogEntry(
        id="maiz",
        name_es="Ilustrativo",
        icon="🌱",
        seasons=["primera", "postrera"],
        cycle_days=90,
        water_need=water_need,
        n_fixing=n_fixing,
        root_depth="deep",
        erosion_cover=erosion_cover,
        drought_tolerance=drought,
        market_tier=market,
        local_source=True,
        source="test only: worked example in docs/work-packages/02-engine.md",
    )


def test_round_half_up_rounds_two_and_a_half_to_three() -> None:
    assert round_half_up(2.5) == 3


def test_round_half_up_rounds_just_below_half_down() -> None:
    assert round_half_up(3.49) == 3


def test_worked_example_combines_seasons(site: SiteProfile) -> None:
    # Worked example tiers: maize-like primera, bean-like postrera (canícula is story 04).
    primera = illustrative_crop("medium", False, "medium", "low", "medium")
    postrera = illustrative_crop("low", True, "low", "medium", "high")

    criteria = score_option(site, primera, postrera, irrigation=False)

    assert criteria == {"water": 4.0, "soil": 2.5, "income": 4.0, "risk": 1.0}


def test_fallow_both_seasons_scores_the_fixed_none_row(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    criteria = score_option(site, crops["none"], crops["none"], irrigation=False)

    assert criteria == {"water": 5.0, "soil": 1.0, "income": 1.0, "risk": 5.0}


def test_weighted_score_uses_unrounded_criteria_and_priorities() -> None:
    # Worked example: (5 x 4 + 3 x 2.5 + 3 x 4 + 3 x 1) / 14 = 42.5 / 14.
    criteria = {"water": 4.0, "soil": 2.5, "income": 4.0, "risk": 1.0}
    priorities = Priorities(water=5, soil=3, income=3, risk=3)

    assert weighted_score(criteria, priorities) == pytest.approx(42.5 / 14)
