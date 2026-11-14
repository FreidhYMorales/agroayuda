from collections import Counter
from pathlib import Path
from typing import get_args

from contracts import CropCatalogEntry, CropId
from data_pipeline.outputs import read_catalog_csv

CROPS_CSV = Path(__file__).resolve().parents[2] / "data" / "catalog" / "crops.csv"

EXPECTED_IDS = {
    "maiz",
    "frijol",
    "maiz_frijol",
    "maicillo",
    "gandul",
    "mucuna",
    "canavalia",
    "ajonjoli",
    "ayote",
    "none",
}


def test_crop_id_literal_is_the_expected_list() -> None:
    assert set(get_args(CropId.__value__)) == EXPECTED_IDS


def test_catalog_has_one_sourced_row_per_crop_id() -> None:
    crops = read_catalog_csv(CROPS_CSV, CropCatalogEntry)

    counts = Counter(crop.id for crop in crops)
    assert set(counts) == EXPECTED_IDS
    assert max(counts.values()) == 1
    assert [crop.id for crop in crops if not crop.source.strip()] == []
