from collections.abc import Callable

import pytest

from contracts import (
    CropCatalogEntry,
    Priorities,
    RecommendationRequest,
    RotationTemplate,
    SiteProfile,
)
from engine.recommend import recommend


def request_for(primera: str, postrera: str) -> RecommendationRequest:
    return RecommendationRequest.model_validate(
        {
            "location": {"lat": 14.70, "lon": -89.50},
            "current_rotation": {"primera": primera, "postrera": postrera},
        }
    )


def test_chiquimula_maize_bean_gets_current_then_two_scored_alternatives(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """Hand computation on the real crops.csv, equal weights (priorities are story 02).

    maiz: water 3, soil 2, income 3, risk 1; frijol: 5, 3, 5, 3;
    maiz_frijol: 3, 5, 5, 1; maicillo: 5, 2, 1, 5.
    maiz -> frijol (current): 4, 2.5, 4, 1 -> rounded 4, 3, 4, 1; bare Dec-Apr.
    frijol -> maicillo: 5, 2.5, 3, 3 -> 5, 3, 3, 3; mean 3.375; bare Jan-Apr and Aug.
    maiz_frijol -> maicillo: 4, 3.5, 3, 1 -> 4, 4, 3, 1; mean 2.875; bare Jan-Apr.
    """
    options = recommend(site, request_for("maiz", "frijol"), list(crops.values()), templates)

    summary = [
        (
            option.sequence.primera,
            option.sequence.postrera,
            option.is_current,
            option.criteria.model_dump(),
            option.bare_months,
        )
        for option in options
    ]
    assert summary == [
        ("maiz", "frijol", True, {"water": 4, "soil": 3, "income": 4, "risk": 1}, [12, 1, 2, 3, 4]),
        (
            "frijol",
            "maicillo",
            False,
            {"water": 5, "soil": 3, "income": 3, "risk": 3},
            [1, 2, 3, 4, 8],
        ),
        (
            "maiz_frijol",
            "maicillo",
            False,
            {"water": 4, "soil": 4, "income": 3, "risk": 1},
            [1, 2, 3, 4],
        ),
    ]


def test_every_season_valid_rotation_gets_three_distinct_options_current_first(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    rotations = [
        (primera.id, postrera.id)
        for primera in crops.values()
        if "primera" in primera.seasons
        for postrera in crops.values()
        if "postrera" in postrera.seasons
    ]
    # 7 primera-capable x 5 postrera-capable crops in crops.csv, none -> none included.
    assert len(rotations) == 35
    assert ("none", "none") in rotations

    failures = []
    for primera, postrera in rotations:
        options = recommend(site, request_for(primera, postrera), list(crops.values()), templates)
        sequences = [(o.sequence.primera, o.sequence.postrera) for o in options]
        current_first = sequences[0] == (primera, postrera) and options[0].is_current
        others_not_current = not any(o.is_current for o in options[1:])
        if (
            len(set(sequences)) != 3
            or len(options) != 3
            or not current_first
            or not others_not_current
        ):
            failures.append((primera, postrera, sequences))
    assert failures == []


@pytest.mark.parametrize(
    ("first", "second"),
    [
        (("canavalia", "maicillo"), ("gandul", "maicillo")),
        (("gandul", "maicillo"), ("canavalia", "maicillo")),
    ],
)
def test_tied_alternatives_keep_template_order(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    make_template: Callable[[str, str], RotationTemplate],
    first: tuple[str, str],
    second: tuple[str, str],
) -> None:
    """gandul and canavalia have the same tiers in crops.csv (water 5, soil 5, income 1, risk 5).

    Either one -> maicillo: 5, 3.5, 1, 5 (mean 3.625), above frijol -> maicillo (3.375).
    """
    templates = [make_template(*first), make_template(*second), make_template("frijol", "maicillo")]

    options = recommend(site, request_for("maiz", "frijol"), list(crops.values()), templates)

    assert [(o.sequence.primera, o.sequence.postrera) for o in options[1:]] == [first, second]


def ranked_alternatives(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
    priorities: dict[str, int],
) -> list[tuple[str, str]]:
    request = request_for("maiz", "frijol").model_copy(
        update={"priorities": Priorities(**priorities)}
    )
    options = recommend(site, request, list(crops.values()), templates)
    return [(o.sequence.primera, o.sequence.postrera) for o in options[1:]]


def test_water_first_ranks_bean_then_sorghum_first(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """5/1/1/1 on float criteria (crops.csv, story 01 docstring values):

    frijol -> maicillo (5, 2.5, 3, 3): (25 + 2.5 + 3 + 3) / 8 = 4.1875.
    maiz_frijol -> maicillo (4, 3.5, 3, 1): (20 + 3.5 + 3 + 1) / 8 = 3.4375.
    """
    priorities = {"water": 5, "soil": 1, "income": 1, "risk": 1}

    assert ranked_alternatives(site, crops, templates, priorities) == [
        ("frijol", "maicillo"),
        ("maiz_frijol", "maicillo"),
    ]


def test_soil_first_ranks_maize_bean_intercrop_first(
    site: SiteProfile,
    crops: dict[str, CropCatalogEntry],
    templates: list[RotationTemplate],
) -> None:
    """1/5/1/1 on float criteria:

    maiz_frijol -> maicillo (4, 3.5, 3, 1): (4 + 17.5 + 3 + 1) / 8 = 3.1875.
    frijol -> maicillo (5, 2.5, 3, 3): (5 + 12.5 + 3 + 3) / 8 = 2.9375.
    """
    priorities = {"water": 1, "soil": 5, "income": 1, "risk": 1}

    assert ranked_alternatives(site, crops, templates, priorities) == [
        ("maiz_frijol", "maicillo"),
        ("frijol", "maicillo"),
    ]
