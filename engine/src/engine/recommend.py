"""Selection (docs/spec.md): the current rotation plus the two best alternatives."""

from contracts import (
    Criteria,
    CropCatalogEntry,
    CropId,
    Delta,
    DeltaVsCurrent,
    RecommendationRequest,
    Rotation,
    RotationOption,
    RotationTemplate,
    SiteProfile,
)
from engine.calendar import bare_months
from engine.errors import InvalidRequestError
from engine.scoring import (
    confidence,
    failure_reason,
    round_half_up,
    score_option,
    weighted_score,
)
from engine.texts import LOCAL_REVIEW_ES, canicula_evidence, data_gaps, reason_line


def _option(
    site: SiteProfile,
    rotation: Rotation,
    crops: dict[CropId, CropCatalogEntry],
    request: RecommendationRequest,
    is_current: bool,
) -> tuple[float, RotationOption]:
    primera, postrera = crops[rotation.primera], crops[rotation.postrera]
    scores = score_option(site, primera, postrera, request.constraints.irrigation)
    rank = weighted_score(scores, request.priorities)
    criteria = Criteria(**{name: round_half_up(value) for name, value in scores.items()})
    option = RotationOption(
        sequence=rotation,
        is_current=is_current,
        recommended=False,
        not_recommended_reason=failure_reason(site, primera, request.constraints.irrigation),
        bare_months=bare_months(primera, postrera),
        criteria=criteria,
        delta_vs_current=DeltaVsCurrent(water="same", soil="same", income="same", risk="same"),
        confidence=confidence(site, [primera, postrera]),
        reasons=[reason_line(request.priorities, criteria)],
        evidence=canicula_evidence(site),
        benefits=[],
        data_gaps=data_gaps(),
        local_review=[LOCAL_REVIEW_ES],
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
    current = request.current_rotation
    for season, crop_id in (("primera", current.primera), ("postrera", current.postrera)):
        if crop_id not in by_id:
            raise InvalidRequestError(f"{crop_id} is not in the crop catalog")
        if season not in by_id[crop_id].seasons:
            raise InvalidRequestError(f"{crop_id} is not a {season} crop")
    current_rank, current_option = _option(site, current, by_id, request, is_current=True)
    alternatives = [
        _option(site, Rotation(primera=t.primera, postrera=t.postrera), by_id, request, False)
        for t in templates
        if (t.primera, t.postrera) != (current.primera, current.postrera)
    ]
    # sorted() is stable, so equal scores keep template (CSV) order.
    ranked = sorted(alternatives, key=lambda pair: pair[0], reverse=True)
    # Slot 1: the best passing alternative, if any; slot 2: the best one left, passing or not.
    passing = [pair for pair in ranked if pair[1].not_recommended_reason is None]
    slot1_rank, slot1 = passing[0] if passing else ranked[0]
    slot2 = next(option for _, option in ranked if option is not slot1)
    if slot1.not_recommended_reason is None and slot1_rank > current_rank:
        slot1 = slot1.model_copy(update={"recommended": True})
    return [
        current_option,
        _with_deltas(slot1, current_option),
        _with_deltas(slot2, current_option),
    ]


def _delta(option_score: int, current_score: int) -> Delta:
    if option_score > current_score:
        return "better"
    if option_score < current_score:
        return "worse"
    return "same"


def _with_deltas(option: RotationOption, current: RotationOption) -> RotationOption:
    """Compare the rounded criteria shown on screen, so arrows always agree with the bars."""
    mine, theirs = option.criteria, current.criteria
    deltas = DeltaVsCurrent(
        water=_delta(mine.water, theirs.water),
        soil=_delta(mine.soil, theirs.soil),
        income=_delta(mine.income, theirs.income),
        risk=_delta(mine.risk, theirs.risk),
    )
    return option.model_copy(update={"delta_vs_current": deltas})
