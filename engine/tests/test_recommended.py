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
