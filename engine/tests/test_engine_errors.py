import pytest

from contracts import CropCatalogEntry, RecommendationRequest, RotationTemplate, SiteProfile
from engine.errors import InvalidRequestError
from engine.recommend import recommend


def request_for(primera: str, postrera: str) -> RecommendationRequest:
    return RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": primera, "postrera": postrera},
        }
    )


def test_postrera_only_crop_in_primera_is_rejected(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    with pytest.raises(InvalidRequestError, match=r"^maicillo is not a primera crop$"):
        recommend(site, request_for("maicillo", "frijol"), list(crops.values()), templates)
