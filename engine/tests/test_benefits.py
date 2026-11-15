from collections.abc import Callable

from contracts import (
    CropCatalogEntry,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend


def recommend_for(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
    primera: str,
    postrera: str,
) -> dict[tuple[str, str], list[str]]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": primera, "postrera": postrera},
        }
    )
    options: list[RotationOption] = recommend(site, request, list(crops.values()), templates)
    return {(o.sequence.primera, o.sequence.postrera): o.benefits for o in options}


def test_benefits_name_what_improves_over_the_current(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Current maiz -> frijol 4/3/4/1. frijol -> maicillo 5/3/3/2 improves water and risk;
    maiz_frijol -> maicillo 4/4/3/1 improves soil."""
    benefits = recommend_for(site, crops, templates, "maiz", "frijol")

    assert benefits[("frijol", "maicillo")] == ["Mejora frente a su rotación en: agua y riesgo."]
    assert benefits[("maiz_frijol", "maicillo")] == ["Mejora frente a su rotación en: suelo."]


def test_four_improvements_are_listed_with_commas_and_y(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Current maiz -> none: water 4, soil (2 + 1) / 2 - 0.5 (8 bare) = 1, income 2,
    risk min(0, 5) -> 1. frijol -> maicillo 5/3/3/2 beats all four."""
    benefits = recommend_for(site, crops, templates, "maiz", "none")

    assert benefits[("frijol", "maicillo")] == [
        "Mejora frente a su rotación en: agua, suelo, ingreso y riesgo."
    ]


def test_no_improvement_means_no_benefits_line(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    make_template: Callable[[str, str], RotationTemplate],
) -> None:
    """canavalia and gandul share tiers and cycle in crops.csv, so canavalia -> maicillo
    improves nothing over current gandul -> maicillo; the current never has a line."""
    templates = [make_template("canavalia", "maicillo"), make_template("frijol", "maicillo")]

    benefits = recommend_for(site, crops, templates, "gandul", "maicillo")

    assert (benefits[("gandul", "maicillo")], benefits[("canavalia", "maicillo")]) == ([], [])
