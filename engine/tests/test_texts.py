from contracts import (
    CropCatalogEntry,
    Priorities,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend


def maize_bean(
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


def test_reasons_cite_the_top_priority_with_the_option_score(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Water-first 5/3/3/3, example site: options are maiz -> frijol (water 4),
    frijol -> maicillo (5) and maiz_frijol -> maicillo (4)."""
    water_first = Priorities(water=5, soil=3, income=3, risk=3)

    options = maize_bean(site, crops, templates, water_first)

    assert [o.reasons for o in options] == [
        ["Su prioridad es cuidar el agua: esta opción saca 4 de 5."],
        ["Su prioridad es cuidar el agua: esta opción saca 5 de 5."],
        ["Su prioridad es cuidar el agua: esta opción saca 4 de 5."],
    ]
