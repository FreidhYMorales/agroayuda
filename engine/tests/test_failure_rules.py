import pytest

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


def test_drought_sensitive_primera_crop_fails_in_a_high_canicula(
    site: SiteProfile, maiz: CropCatalogEntry
) -> None:
    # maíz in crops.csv: water medium, drought tolerance low.
    assert failure_reason(with_canicula(site, "high"), maiz, irrigation=False) == F2


def test_f1_wins_when_both_rules_apply(site: SiteProfile, maiz: CropCatalogEntry) -> None:
    thirsty_and_sensitive = maiz.model_copy(update={"water_need": "high"})  # drought low

    assert (
        failure_reason(with_canicula(site, "high"), thirsty_and_sensitive, irrigation=False) == F1
    )


@pytest.mark.parametrize("level", ["medium", "low", None])
def test_no_warning_below_a_high_canicula(
    site: SiteProfile, maiz: CropCatalogEntry, level: Level | None
) -> None:
    checked = (
        site.model_copy(update={"risks": [r for r in site.risks if r.id != "canicula"]})
        if level is None
        else with_canicula(site, level)
    )

    assert failure_reason(checked, maiz, irrigation=False) is None
