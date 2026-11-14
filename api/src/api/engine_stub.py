"""TEMPORARY stand-in for engine.recommend until package 02 lands (task L7 swaps it out).

Returns the three options from the frozen example, with the current option set to the farmer's
rotation, so the web app can be built end to end against a real HTTP API.
"""

import json
from pathlib import Path
from typing import Final

from contracts import RecommendationRequest, RecommendationResponse, RotationOption, SiteProfile

EXAMPLE: Final = (
    Path(__file__).resolve().parents[3] / "contracts" / "examples" / "recommendation_response.json"
)


def recommend(site: SiteProfile, request: RecommendationRequest) -> list[RotationOption]:
    del site  # the real engine scores against the site; the stub ignores it
    example = RecommendationResponse.model_validate(json.loads(EXAMPLE.read_text("utf-8")))
    current, *alternatives = example.options
    return [current.model_copy(update={"sequence": request.current_rotation}), *alternatives]
