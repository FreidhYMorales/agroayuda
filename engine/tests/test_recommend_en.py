"""recommend() fills every English sibling next to the Spanish text (i18n story 05)."""

from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend

LOCAL_REVIEW_EN = "Talk to a local technician before changing what you plant."
DROUGHT_EN = "Cannot take much drought in the canícula"


def maize_bean(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], templates: list[RotationTemplate]
) -> dict[tuple[str, str], RotationOption]:
    """Default priorities 3/3/3/3: all four tie, so the reason lists all of them."""
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
        }
    )
    options = recommend(site, request, list(crops.values()), templates)
    return {(o.sequence.primera, o.sequence.postrera): o for o in options}


def test_current_option_texts_in_english(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], templates: list[RotationTemplate]
) -> None:
    """Example site: high canícula, share 0.7, full soil; maíz has low drought tolerance."""
    current = maize_bean(site, crops, templates)[("maiz", "frijol")]

    assert current.reasons_en == [
        "You gave several things the same importance. This option scores: saving water 4 of 5, "
        "caring for the soil 3 of 5, income 4 of 5 and lowering the risk 1 of 5."
    ]
    assert current.not_recommended_reason_en == DROUGHT_EN
    assert current.benefits_en == []
    assert current.data_gaps_en == ["NASA POWER rain is a regional estimate."]
    assert current.local_review_en == [LOCAL_REVIEW_EN]
    assert [e.value_en for e in current.evidence] == ["21 of 30 years"]
    # The Spanish stays as it was.
    assert current.local_review == ["Consulte con un técnico local antes de cambiar su siembra."]
    assert current.not_recommended_reason == "Aguanta poco la sequía de la canícula"


def test_alternatives_texts_in_english(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], templates: list[RotationTemplate]
) -> None:
    """Current maiz -> frijol 4/3/4/1. frijol -> maicillo 5/3/3/2 improves water and risk;
    maiz_frijol -> maicillo 4/4/3/1 improves soil."""
    options = maize_bean(site, crops, templates)
    bean_sorghum = options[("frijol", "maicillo")]
    intercrop_sorghum = options[("maiz_frijol", "maicillo")]

    assert bean_sorghum.reasons_en == [
        "You gave several things the same importance. This option scores: saving water 5 of 5, "
        "caring for the soil 3 of 5, income 3 of 5 and lowering the risk 2 of 5."
    ]
    assert bean_sorghum.benefits_en == ["Better than your rotation in: water and risk."]
    assert bean_sorghum.not_recommended_reason_en is None
    assert bean_sorghum.local_review_en == [LOCAL_REVIEW_EN]
    assert intercrop_sorghum.benefits_en == ["Better than your rotation in: soil."]
    assert intercrop_sorghum.not_recommended_reason_en == DROUGHT_EN
