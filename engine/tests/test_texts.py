import pytest

from contracts import (
    Criteria,
    CropCatalogEntry,
    Priorities,
    RecommendationRequest,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend
from engine.texts import reason_line


def maize_bean(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
    priorities: Priorities,
) -> list[RotationOption]:
    request = RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": "maiz", "postrera": "frijol"},
            "priorities": priorities.model_dump(),
        }
    )
    return recommend(site, request, list(crops.values()), templates)


def test_reasons_cite_the_top_priority_with_the_option_score(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Water-first 5/3/3/3, example site: options are maiz -> frijol (water 4),
    frijol -> maicillo (5) and maiz_frijol -> maicillo (4)."""
    water_first = Priorities(water=5, soil=3, income=3, risk=3)

    options = maize_bean(site, crops, templates, water_first)

    assert [o.reasons for o in options] == [
        ["Su prioridad es cuidar el agua: esta opción saca 4 de 5."],
        ["Su prioridad es cuidar el agua: esta opción saca 5 de 5."],
        ["Su prioridad es cuidar el agua: esta opción saca 4 de 5."],
    ]


@pytest.mark.parametrize(
    ("priorities", "expected"),
    [
        ((5, 4, 2, 2), "Su prioridad es cuidar el agua: esta opción saca 1 de 5."),
        ((1, 5, 4, 1), "Su prioridad es cuidar el suelo: esta opción saca 2 de 5."),
        ((1, 1, 5, 1), "Su prioridad es el ingreso: esta opción saca 3 de 5."),
        ((1, 1, 1, 5), "Su prioridad es bajar el riesgo: esta opción saca 4 de 5."),
    ],
)
def test_one_top_priority_is_named(priorities: tuple[int, int, int, int], expected: str) -> None:
    # Distinct criteria (water 1, soil 2, income 3, risk 4) show which one was picked.
    water, soil, income, risk = priorities
    chosen = Priorities(water=water, soil=soil, income=income, risk=risk)

    assert reason_line(chosen, Criteria(water=1, soil=2, income=3, risk=4)) == expected


@pytest.mark.parametrize(
    ("priorities", "expected"),
    [
        (
            (4, 4, 2, 2),
            "Usted dio la misma importancia a varias cosas. Esta opción saca: "
            "cuidar el agua 1 de 5 y cuidar el suelo 2 de 5.",
        ),
        (
            (1, 4, 1, 4),
            "Usted dio la misma importancia a varias cosas. Esta opción saca: "
            "cuidar el suelo 2 de 5 y bajar el riesgo 4 de 5.",
        ),
        (
            (3, 3, 3, 3),
            "Usted dio la misma importancia a varias cosas. Esta opción saca: "
            "cuidar el agua 1 de 5, cuidar el suelo 2 de 5, el ingreso 3 de 5 "
            "y bajar el riesgo 4 de 5.",
        ),
    ],
)
def test_tied_top_priorities_are_all_listed(
    priorities: tuple[int, int, int, int], expected: str
) -> None:
    # A tie never claims one priority over the others; order stays water > soil > income > risk.
    water, soil, income, risk = priorities
    chosen = Priorities(water=water, soil=soil, income=income, risk=risk)

    assert reason_line(chosen, Criteria(water=1, soil=2, income=3, risk=4)) == expected


def test_every_option_asks_to_check_with_a_local_technician(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    options = maize_bean(site, crops, templates, Priorities())

    assert [o.local_review for o in options] == [
        ["Consulte con un técnico local antes de cambiar su siembra."]
    ] * 3
