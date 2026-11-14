from contracts import CropCatalogEntry, SiteProfile
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
    # gandul 180 d covers May-Oct; fallow postrera: bare Nov-Apr (6). Soil (5 + 1) / 2 - 0.5.
    assert soil(site, crops, "gandul", "none") == 2.5


def test_five_bare_months_cost_nothing(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # maíz May-Aug, frijol Sep-Nov: bare Dec-Apr (5). Soil (2 + 3) / 2, no penalty.
    assert soil(site, crops, "maiz", "frijol") == 2.5
