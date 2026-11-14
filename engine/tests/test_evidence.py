from contracts import (
    CropCatalogEntry,
    Evidence,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend

CANICULA_TEXT = (
    "Racha seca larga a mediados de julio y agosto. "
    "La lluvia de NASA POWER es una estimación regional."
)


def recommend_for(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
    primera: str = "maiz",
    postrera: str = "frijol",
) -> list[RotationOption]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": primera, "postrera": postrera},
        }
    )
    return recommend(site, request, list(crops.values()), templates)


def test_every_option_cites_the_nasa_power_canicula_share(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    # Example site: canícula share 0.7 of 1991-2020 -> 0.7 x 30 = 21 years.
    expected = Evidence(text_es=CANICULA_TEXT, dataset="NASA POWER", value="21 de 30 años")

    options = recommend_for(site, crops, templates)

    assert [o.evidence for o in options] == [[expected]] * 3
