from contracts import CropCatalogEntry
from engine.calendar import bare_months


def test_maize_then_bean_leaves_dec_to_apr_bare(
    maiz: CropCatalogEntry, frijol: CropCatalogEntry
) -> None:
    assert bare_months(maiz, frijol) == [12, 1, 2, 3, 4]


def test_fallow_both_seasons_leaves_every_month_bare_december_first(
    crops: dict[str, CropCatalogEntry],
) -> None:
    assert bare_months(crops["none"], crops["none"]) == [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]


def test_postrera_crop_past_december_covers_january(
    maiz: CropCatalogEntry, crops: dict[str, CropCatalogEntry]
) -> None:
    # Mucuna: 150 days from September covers Sep-Jan; maize covers May-Aug.
    assert bare_months(maiz, crops["mucuna"]) == [2, 3, 4]
