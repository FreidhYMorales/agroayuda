from collections.abc import Callable

from contracts import (
    CropCatalogEntry,
    Priorities,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend


def recommend_maize_bean(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
    priorities: Priorities,
) -> list[RotationOption]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
            "priorities": priorities.model_dump(),
        }
    )
    return recommend(site, request, list(crops.values()), templates)


def summary(options: list[RotationOption]) -> list[tuple[str, str, bool]]:
    return [(o.sequence.primera, o.sequence.postrera, o.recommended) for o in options]


def test_passing_alternative_that_beats_the_current_is_recommended(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Example site (canícula high), default priorities 3/3/3/3:

    maiz -> frijol (current, F2): 4, 2.5, 4, 1 -> 2.875.
    frijol -> maicillo (passes): 5, 2.5, 3, 2 -> 3.125 > 2.875, so recommended.
    maiz_frijol -> maicillo (F2): 4, 3.5, 3, 1 -> 2.875.
    """
    options = recommend_maize_bean(site, crops, templates, Priorities())

    assert summary(options) == [
        ("maiz", "frijol", False),
        ("frijol", "maicillo", True),
        ("maiz_frijol", "maicillo", False),
    ]


def test_best_passing_alternative_takes_slot_one_over_a_failing_one(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Example site (canícula high), soil-first 1/5/1/1:

    maiz_frijol -> maicillo (F2): (4 + 17.5 + 3 + 1) / 8 = 3.1875, best score but fails.
    frijol -> maicillo (passes): (5 + 12.5 + 3 + 2) / 8 = 2.8125.
    maiz -> frijol (current): (4 + 12.5 + 4 + 1) / 8 = 2.6875, so frijol -> maicillo wins.
    """
    soil_first = Priorities(water=1, soil=5, income=1, risk=1)
    options = recommend_maize_bean(site, crops, templates, soil_first)

    assert summary(options) == [
        ("maiz", "frijol", False),
        ("frijol", "maicillo", True),
        ("maiz_frijol", "maicillo", False),
    ]


def test_nothing_is_recommended_when_the_current_scores_best(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Income-first 1/1/5/1: current (4 + 2.5 + 20 + 1) / 8 = 3.4375;
    frijol -> maicillo (5 + 2.5 + 15 + 2) / 8 = 3.0625 passes but does not beat it;
    maiz_frijol -> maicillo (4 + 3.5 + 15 + 1) / 8 = 2.9375.
    """
    income_first = Priorities(water=1, soil=1, income=5, risk=1)
    options = recommend_maize_bean(site, crops, templates, income_first)

    assert summary(options) == [
        ("maiz", "frijol", False),
        ("frijol", "maicillo", False),
        ("maiz_frijol", "maicillo", False),
    ]


def test_when_no_alternative_passes_the_top_two_are_shown_unrecommended(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    make_template: Callable[[str, str], RotationTemplate],
) -> None:
    """Soil-first 1/5/1/1; ayote and maiz_frijol (drought low) both fail F2.

    ayote -> maicillo: water 4, soil (3 + 2) / 2 = 2.5, income 2, risk 1 -> 19.5 / 8 = 2.4375.
    maiz_frijol -> maicillo: 25.5 / 8 = 3.1875, above the current 2.6875 but failing.
    """
    templates = [make_template("ayote", "maicillo"), make_template("maiz_frijol", "maicillo")]
    soil_first = Priorities(water=1, soil=5, income=1, risk=1)
    options = recommend_maize_bean(site, crops, templates, soil_first)

    assert summary(options) == [
        ("maiz", "frijol", False),
        ("maiz_frijol", "maicillo", False),
        ("ayote", "maicillo", False),
    ]
