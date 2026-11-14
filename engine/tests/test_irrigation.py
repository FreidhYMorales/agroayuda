from contracts import (
    CropCatalogEntry,
    Level,
    RecommendationRequest,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend
from engine.scoring import failure_reason, score_option


def with_canicula(site: SiteProfile, level: Level) -> SiteProfile:
    risks = [
        risk.model_copy(update={"level": level}) if risk.id == "canicula" else risk
        for risk in site.risks
    ]
    return site.model_copy(update={"risks": risks})


def thirsty(frijol: CropCatalogEntry) -> CropCatalogEntry:
    """Test-built: frijol with high water need (no crop in crops.csv has it today)."""
    return frijol.model_copy(update={"water_need": "high"})


def water_and_risk(
    site: SiteProfile, primera: CropCatalogEntry, postrera: CropCatalogEntry, irrigation: bool
) -> tuple[float, float]:
    criteria = score_option(site, primera, postrera, irrigation)
    return criteria["water"], criteria["risk"]


def test_irrigation_adds_one_risk_point_to_a_thirsty_crop_and_no_water(
    site: SiteProfile, frijol: CropCatalogEntry, crops: dict[str, CropCatalogEntry]
) -> None:
    """Canícula low. Thirsty frijol: water 7 - 6 = 1, risk 3 (+1 with irrigation = 4).

    maicillo: water 5, risk 5. Water (1 + 5) / 2 = 3 both ways; risk min 3 -> 4.
    """
    low = with_canicula(site, "low")
    maicillo = crops["maicillo"]

    assert water_and_risk(low, thirsty(frijol), maicillo, irrigation=False) == (3.0, 3.0)
    assert water_and_risk(low, thirsty(frijol), maicillo, irrigation=True) == (3.0, 4.0)


def test_irrigation_leaves_a_low_water_crop_unchanged(
    site: SiteProfile, frijol: CropCatalogEntry, crops: dict[str, CropCatalogEntry]
) -> None:
    """Canícula low. Real frijol (water low): water (5 + 5) / 2 = 5, risk min(3, 5) = 3.

    Same values with and without irrigation.
    """
    low = with_canicula(site, "low")
    maicillo = crops["maicillo"]

    assert water_and_risk(low, frijol, maicillo, irrigation=False) == (5.0, 3.0)
    assert water_and_risk(low, frijol, maicillo, irrigation=True) == (5.0, 3.0)


def test_irrigation_turns_off_f1(site: SiteProfile, frijol: CropCatalogEntry) -> None:
    high = with_canicula(site, "high")

    assert failure_reason(high, thirsty(frijol), irrigation=True) is None


def test_irrigated_farm_sees_no_canicula_warnings(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Example site (canícula high): without irrigation maíz and maiz_frijol carry F2."""
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
            "constraints": {"irrigation": True},
        }
    )
    options = recommend(site, request, list(crops.values()), templates)

    assert [
        (o.sequence.primera, o.sequence.postrera, o.not_recommended_reason) for o in options
    ] == [
        ("maiz", "frijol", None),
        ("frijol", "maicillo", None),
        ("maiz_frijol", "maicillo", None),
    ]
