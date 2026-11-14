"""Selection (docs/spec.md): the current rotation plus the two best alternatives."""

from contracts import (
    Criteria,
    CropCatalogEntry,
    CropId,
    DeltaVsCurrent,
    RecommendationRequest,
    Rotation,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.calendar import bare_months
from engine.scoring import round_half_up, score_option


def _option(
    site: SiteProfile,
    rotation: Rotation,
    crops: dict[CropId, CropCatalogEntry],
    irrigation: bool,
    is_current: bool,
) -> tuple[float, RotationOption]:
    primera, postrera = crops[rotation.primera], crops[rotation.postrera]
    scores = score_option(site, primera, postrera, irrigation)
    # Equal weights until the farmer's priorities are wired in (story 02).
    rank = sum(scores.values()) / len(scores)
    option = RotationOption(
        sequence=rotation,
        is_current=is_current,
        recommended=False,
        not_recommended_reason=None,
        bare_months=bare_months(primera, postrera),
        criteria=Criteria(**{name: round_half_up(value) for name, value in scores.items()}),
        delta_vs_current=DeltaVsCurrent(water="same", soil="same", income="same", risk="same"),
        confidence="high",
        reasons=[],
        evidence=[],
        benefits=[],
        data_gaps=[],
        local_review=[],
    )
    return rank, option


def recommend(
    site: SiteProfile,
    request: RecommendationRequest,
    crops: list[CropCatalogEntry],
    templates: list[RotationTemplate],
) -> list[RotationOption]:
    """Exactly 3 options: current, slot 1, slot 2."""
    by_id = {crop.id: crop for crop in crops}
    irrigation = request.constraints.irrigation
    current = request.current_rotation
    _, current_option = _option(site, current, by_id, irrigation, is_current=True)
    alternatives = [
        _option(site, Rotation(primera=t.primera, postrera=t.postrera), by_id, irrigation, False)
        for t in templates
        if (t.primera, t.postrera) != (current.primera, current.postrera)
    ]
    # sorted() is stable, so equal scores keep template (CSV) order.
    ranked = sorted(alternatives, key=lambda pair: pair[0], reverse=True)
    return [current_option, ranked[0][1], ranked[1][1]]
