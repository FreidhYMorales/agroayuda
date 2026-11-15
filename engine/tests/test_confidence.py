from contracts import CropCatalogEntry, RecommendationRequest, RotationTemplate, SiteProfile
from engine.recommend import recommend
from engine.scoring import confidence


def rate(site: SiteProfile, crops: dict[str, CropCatalogEntry], *ids: str) -> str:
    return confidence(site, [crops[crop_id] for crop_id in ids])


def test_one_non_local_crop_gives_medium_confidence(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Full soil (0) + ayote local_source false (1) + frijol local (0) = 1.
    assert rate(site, crops, "ayote", "frijol") == "medium"


def test_two_non_local_crops_give_low_and_all_local_give_high(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # ayote and ajonjolí are both non-local (2); maíz and frijol are both local (0).
    assert (rate(site, crops, "ayote", "ajonjoli"), rate(site, crops, "maiz", "frijol")) == (
        "low",
        "high",
    )


def test_fallow_never_counts_as_a_non_local_crop(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Real none -> ajonjolí: only ajonjolí counts (1). A test-built none marked non-local
    # must still not count, since the rule only counts non-`none` crops.
    non_local_none = crops["none"].model_copy(update={"local_source": False})

    assert rate(site, crops, "none", "ajonjoli") == "medium"
    assert confidence(site, [non_local_none, crops["ajonjoli"]]) == "medium"


def test_missing_soil_adds_one_factor(
    site_null_soil: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Null soil (1) + all local (0) = medium; null soil (1) + ayote (1) = low.
    assert (
        rate(site_null_soil, crops, "maiz", "frijol"),
        rate(site_null_soil, crops, "ayote", "frijol"),
    ) == ("medium", "low")


def test_every_option_gets_its_own_confidence(
    site_null_soil: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Null-soil site: every option starts at 1 factor; all stub-template crops are local."""
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
        }
    )
    options = recommend(site_null_soil, request, list(crops.values()), templates)

    assert [o.confidence for o in options] == ["medium", "medium", "medium"]
