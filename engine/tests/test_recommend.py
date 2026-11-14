from contracts import (
    CropCatalogEntry,
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
