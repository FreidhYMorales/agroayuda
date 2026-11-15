from contracts import CropCatalogEntry, SiteProfile
from engine.calendar import bare_months
from engine.scoring import score_option


def soil(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], primera: str, postrera: str
) -> float:
    return score_option(site, crops[primera], crops[postrera], irrigation=False)["soil"]


def test_nine_bare_months_cost_half_a_soil_point(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # frijol 75 d covers May-Jul; fallow postrera: bare Aug-Apr (9). Soil (3 + 1) / 2 - 0.5.
    assert soil(site, crops, "frijol", "none") == 1.5


def test_exactly_six_bare_months_already_cost_half_a_point(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # gandul 180 d covers May-Oct: bare Nov-Apr (6). Story 18: gandul is still in the field at
    # the September postrera planting, so postrera scores as gandul. Soil (5 + 5) / 2 - 0.5.
    assert soil(site, crops, "gandul", "none") == 4.5


def test_long_cycle_crop_is_not_fallow_in_postrera(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Story 18. gandul row in crops.csv: water 5, soil 5, income 1, risk 5. Both seasons score as
    # gandul; soil - 0.5 for 6 bare months; risk min(5 - 1 canícula high in primera, 5) = 4.
    criteria = score_option(site, crops["gandul"], crops["none"], irrigation=False)
    assert criteria == {"water": 5.0, "soil": 4.5, "income": 1.0, "risk": 4.0}


def test_five_bare_months_cost_nothing(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # maíz May-Aug, frijol Sep-Nov: bare Dec-Apr (5). Soil (2 + 3) / 2, no penalty.
    assert soil(site, crops, "maiz", "frijol") == 2.5


def test_short_cycle_crop_leaves_postrera_fallow(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # Story 18 guard. maíz 120 d covers May-Aug, gone by the September planting: postrera stays
    # fallow (none row soil 1). Bare Sep-Apr (8). Soil (2 + 1) / 2 - 0.5.
    assert soil(site, crops, "maiz", "none") == 1.0


def test_long_cycle_crop_keeps_its_bare_months(crops: dict[str, CropCatalogEntry]) -> None:
    # Story 18 guard. gandul 180 d covers May-Oct: bare Nov-Apr, listed December first.
    assert bare_months(crops["gandul"], crops["none"]) == [12, 1, 2, 3, 4, 11]
