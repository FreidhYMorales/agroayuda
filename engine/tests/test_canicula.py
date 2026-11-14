import pytest

from contracts import CropCatalogEntry, Level, SiteProfile
from engine.scoring import score_option


def with_canicula(site: SiteProfile, level: Level | None) -> SiteProfile:
    """The example site with its canícula risk set to `level`, or removed when None."""
    others = [risk for risk in site.risks if risk.id != "canicula"]
    canicula = [
        risk.model_copy(update={"level": level}) for risk in site.risks if risk.id == "canicula"
    ]
    return site.model_copy(update={"risks": others if level is None else [*canicula, *others]})


def risk(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], primera: str, postrera: str
) -> float:
    return score_option(site, crops[primera], crops[postrera], irrigation=False)["risk"]


def test_high_canicula_costs_the_primera_crop_one_risk_point(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # frijol (drought medium) 3 - 1 = 2; maicillo in postrera keeps 5; min = 2.
    assert risk(with_canicula(site, "high"), crops, "frijol", "maicillo") == 2.0


def test_medium_canicula_costs_half_a_point(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    assert risk(with_canicula(site, "medium"), crops, "frijol", "maicillo") == 2.5


@pytest.mark.parametrize("level", ["low", "unknown", None])
def test_low_unknown_or_missing_canicula_costs_nothing(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], level: Level | None
) -> None:
    assert risk(with_canicula(site, level), crops, "frijol", "maicillo") == 3.0


def test_fallow_primera_is_exempt_from_the_canicula(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # none row risk 5, maicillo 5: no penalty on fallow, so min stays 5.
    assert risk(with_canicula(site, "high"), crops, "none", "maicillo") == 5.0


def test_penalty_below_one_is_clamped_to_one(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # maíz (drought low) 1 - 1 = 0; frijol 3; min 0, clamped to 1.
    assert risk(with_canicula(site, "high"), crops, "maiz", "frijol") == 1.0
