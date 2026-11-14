from contracts import CropCatalogEntry, Level, SiteProfile
from engine.scoring import failure_reason

F1 = "Necesita mucha agua justo en la canícula"
F2 = "Aguanta poco la sequía de la canícula"


def with_canicula(site: SiteProfile, level: Level) -> SiteProfile:
    risks = [
        risk.model_copy(update={"level": level}) if risk.id == "canicula" else risk
        for risk in site.risks
    ]
    return site.model_copy(update={"risks": risks})


def test_thirsty_primera_crop_fails_in_a_high_canicula(
    site: SiteProfile, maiz: CropCatalogEntry
) -> None:
    # Test-built crop: no crop in crops.csv has high water need today.
    thirsty = maiz.model_copy(update={"water_need": "high", "drought_tolerance": "medium"})

    assert failure_reason(with_canicula(site, "high"), thirsty, irrigation=False) == F1
