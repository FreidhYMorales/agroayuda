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


def test_no_canicula_share_means_no_evidence(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    risks = [r.model_copy(update={"value": None}) if r.id == "canicula" else r for r in site.risks]
    no_share = site.model_copy(update={"risks": risks})

    options = recommend_for(no_share, crops, templates)

    assert [o.evidence for o in options] == [[], [], []]


POWER_GAP = "La lluvia de NASA POWER es una estimación regional."
SOIL_GAP = "No hay datos de suelo para este punto."


def test_full_soil_and_local_crops_only_note_the_regional_rain(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    current = recommend_for(site, crops, templates)[0]

    assert current.data_gaps == [POWER_GAP]
