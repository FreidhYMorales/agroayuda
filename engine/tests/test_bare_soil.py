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
