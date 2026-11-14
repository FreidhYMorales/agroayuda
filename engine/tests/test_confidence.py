from contracts import CropCatalogEntry, SiteProfile
from engine.scoring import confidence


def rate(site: SiteProfile, crops: dict[str, CropCatalogEntry], *ids: str) -> str:
    return confidence(site, [crops[crop_id] for crop_id in ids])


def test_one_non_local_crop_gives_medium_confidence(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Full soil (0) + ayote local_source false (1) + frijol local (0) = 1.
    assert rate(site, crops, "ayote", "frijol") == "medium"
