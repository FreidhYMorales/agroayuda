from collections.abc import Callable

from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend


def maize_bean(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], templates: list[RotationTemplate]
) -> list[RotationOption]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
        }
    )
    return recommend(site, request, list(crops.values()), templates)


def deltas(options: list[RotationOption]) -> list[tuple[str, str, dict[str, str]]]:
    return [
        (o.sequence.primera, o.sequence.postrera, o.delta_vs_current.model_dump()) for o in options
    ]


def test_alternatives_compare_their_rounded_criteria_with_the_current(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Example site (canícula high), rounded criteria water/soil/income/risk:

    current maiz -> frijol 4/3/4/1; frijol -> maicillo 5/3/3/2; maiz_frijol -> maicillo 4/4/3/1.
    """
    options = maize_bean(site, crops, templates)

    assert deltas(options)[1:] == [
        (
            "frijol",
            "maicillo",
            {"water": "better", "soil": "same", "income": "worse", "risk": "better"},
        ),
        (
            "maiz_frijol",
            "maicillo",
            {"water": "same", "soil": "better", "income": "worse", "risk": "same"},
        ),
    ]


def test_the_current_rotation_is_the_same_as_itself(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    options = maize_bean(site, crops, templates)

    assert deltas(options)[0] == (
        "maiz",
        "frijol",
        {"water": "same", "soil": "same", "income": "same", "risk": "same"},
    )


def test_equal_after_rounding_is_the_same(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    make_template: Callable[[str, str], RotationTemplate],
) -> None:
    """ayote (soil 1 + 0 + 2 = 3) -> frijol (3): soil 3.0; bare Dec-Apr (5), no penalty.

    Current maiz -> frijol soil 2.5. Both round to 3, so the soil arrow is "same".
    """
    options = maize_bean(
        site, crops, [make_template("ayote", "frijol"), make_template("frijol", "maicillo")]
    )
    ayote = next(o for o in options if o.sequence.primera == "ayote")

    assert (ayote.criteria.soil, ayote.delta_vs_current.soil) == (3, "same")
