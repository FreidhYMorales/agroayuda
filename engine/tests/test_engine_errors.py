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


def test_primera_only_crop_in_postrera_is_rejected(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    with pytest.raises(InvalidRequestError, match=r"^maiz is not a postrera crop$"):
        recommend(site, request_for("maiz", "maiz"), list(crops.values()), templates)


def test_crop_missing_from_the_loaded_catalog_is_rejected(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    catalog = [crop for crop in crops.values() if crop.id != "gandul"]

    with pytest.raises(InvalidRequestError, match=r"^gandul is not in the crop catalog$"):
        recommend(site, request_for("gandul", "frijol"), catalog, templates)
