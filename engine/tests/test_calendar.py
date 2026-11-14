from contracts import CropCatalogEntry
from engine.calendar import bare_months


def test_maize_then_bean_leaves_dec_to_apr_bare(
    maiz: CropCatalogEntry, frijol: CropCatalogEntry
) -> None:
    assert bare_months(maiz, frijol) == [12, 1, 2, 3, 4]
