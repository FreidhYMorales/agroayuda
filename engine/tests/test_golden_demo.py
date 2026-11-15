"""Story 14 golden demo: at Chiquimula the farmer's priorities change the recommendation.

Real crops.csv and rotation_templates.csv; the example site with the real Chiquimula canícula
level (low, docs/spec.md demo data), so F1/F2 never fire and no primera crop loses risk.
Current rotation maíz -> maicillo: maíz (water 3, soil 2, income 3, risk 1) and maicillo
(water 5, soil 2, income 1, risk 5) give water 4, soil 2, income 2, risk 1, bare Jan-Apr (4).
"""

import csv
from pathlib import Path

from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend

TEMPLATES_CSV = Path(__file__).resolve().parents[2] / "data" / "catalog" / "rotation_templates.csv"


def real_templates() -> list[RotationTemplate]:
    with TEMPLATES_CSV.open(encoding="utf-8", newline="") as handle:
        return [RotationTemplate.model_validate(row) for row in csv.DictReader(handle)]


def chiquimula(site: SiteProfile) -> SiteProfile:
    risks = [
        risk.model_copy(update={"level": "low"}) if risk.id == "canicula" else risk
        for risk in site.risks
    ]
    return site.model_copy(update={"risks": risks})


def recommended(
    site: SiteProfile, crops: dict[str, CropCatalogEntry], priorities: dict[str, int]
) -> list[tuple[str, str]]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "maicillo"},
            "priorities": priorities,
            "constraints": {"irrigation": False},
        }
    )
    options = recommend(chiquimula(site), request, list(crops.values()), real_templates())
    return [(o.sequence.primera, o.sequence.postrera) for o in options if o.recommended]


def test_water_first_recommends_gandul_at_chiquimula(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # 5/3/3/3 (sum 14). Current: (5*4 + 3*2 + 3*2 + 3*1) / 14 = 35 / 14 = 2.50.
    # gandul -> none (story 18: water 5, soil 4.5, income 1, risk 5):
    # (25 + 13.5 + 3 + 15) / 14 = 56.5 / 14 = 4.04, the best passing alternative.
    priorities = {"water": 5, "soil": 3, "income": 3, "risk": 3}
    assert recommended(site, crops, priorities) == [("gandul", "none")]


def test_income_first_recommends_maiz_frijol_at_chiquimula(
    site: SiteProfile, crops: dict[str, CropCatalogEntry]
) -> None:
    # 1/1/5/1 (sum 8). Current: (4 + 2 + 5*2 + 1) / 8 = 17 / 8 = 2.125.
    # maíz -> frijol (water 4, soil 2.5, income 4, risk 1): (4 + 2.5 + 20 + 1) / 8 = 3.44;
    # next frijol -> maicillo (5, 2.5, 3, 3): 25.5 / 8 = 3.19; gandul -> none: 19.5 / 8 = 2.44.
    priorities = {"water": 1, "soil": 1, "income": 5, "risk": 1}
    assert recommended(site, crops, priorities) == [("maiz", "frijol")]
